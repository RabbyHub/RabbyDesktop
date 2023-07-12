import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { interval } from 'rxjs';
import { extractDappInfoFromURL } from '@/isomorphic/url';
import { getFullAppProxyConf } from '../store/desktopApp';
import { getDappVersionInfo, safeCapturePage } from '../utils/dapps';
import { parseWebsiteFavicon } from '../utils/fetch';
import {
  handleIpcMainInvoke,
  onIpcMainInternalEvent,
  sendToWebContents,
} from '../utils/ipcMainEvents';
import {
  getAllMainUIViews,
  getAllMainUIWindows,
  onMainWindowReady,
} from '../utils/stream-helpers';
import { getTabbedWindowFromWebContents } from './tabbedBrowserWindow';
import {
  confirmDappVersion,
  getDappVersions,
  putDappVersions,
} from '../store/cache';
import { getMainBuildInfo } from '../utils/app';

handleIpcMainInvoke('parse-favicon', async (_, targetURL) => {
  const result = {
    error: null,
    favicon: null as IParsedFavicon | null,
  };
  try {
    const proxyConf = await getFullAppProxyConf();
    const proxyOnParseFavicon =
      proxyConf.proxyType === 'custom'
        ? {
            protocol: proxyConf.proxySettings.protocol,
            host: proxyConf.proxySettings.hostname,
            port: proxyConf.proxySettings.port,
          }
        : undefined;

    result.favicon = await parseWebsiteFavicon(targetURL, {
      timeout: 3000,
      proxy: proxyOnParseFavicon,
    });
  } catch (e: any) {
    result.error = e.message;
  }

  return result;
});

// create popup window with 1366 * 768 size, and capature it
handleIpcMainInvoke('preview-dapp', async (_, targetURL) => {
  const result = await safeCapturePage(targetURL);

  return {
    error: result.error,
    previewImg: result.previewImg,
  };
});

async function detectDappVersoin(httpDappId: string) {
  const result: IDetectHttpTypeDappVersionResult = {
    updated: false,
    latest: null,
    versionQueue: [],
  };

  if (!httpDappId) {
    return {
      error: 'httpDappId is empty',
      result,
    };
  }

  const versionInfo = await getDappVersionInfo(httpDappId);

  if (versionInfo.fetchSuccess) {
    const putResult = putDappVersions(httpDappId, versionInfo);

    result.latest = putResult.latestConfirmedVersion;
    result.versionQueue = putResult.versionQueue;

    if (
      putResult.versionQueue.length >= 2 &&
      putResult.latestConfirmedVersion?.versionSha512 &&
      putResult.versionQueue[0].versionSha512 !==
        putResult.latestConfirmedVersion?.versionSha512
    ) {
      result.updated = true;
    }

    return {
      error: '',
      result,
    };
  }

  const dappVersion = getDappVersions(httpDappId);

  result.updated =
    !!dappVersion.latestConfirmedVersion?.versionSha512 &&
    dappVersion.versionQueue[0]?.versionSha512 !==
      dappVersion.latestConfirmedVersion?.versionSha512;
  result.latest = dappVersion.latestConfirmedVersion;
  result.versionQueue = dappVersion.versionQueue;

  return {
    error: 'Failed to fetch dapp version info',
    result,
  };
}

async function pushNewVersionUpdatedToView(
  currentDappId: string | undefined,
  updated: boolean
) {
  const { windows } = await getAllMainUIWindows();

  const payload = {
    currentDappId,
    result: { updated },
  };

  [
    windows['top-ghost-window'].webContents,
    windows['main-window'].webContents,
  ].forEach((wc) => {
    if (wc.isDestroyed()) return;
    sendToWebContents(wc, '__internal_push:dapps:version-updated', payload);
  });
}

handleIpcMainInvoke('detect-dapp-version', async (_, currentDappId: string) => {
  const detectResult = await detectDappVersoin(currentDappId);

  pushNewVersionUpdatedToView(currentDappId, detectResult.result.updated);

  return detectResult;
});

onMainWindowReady().then(async (mainTabbedWin) => {
  mainTabbedWin.tabs.on('tab-selected-changed', (payload) => {
    if (!payload.selected) pushNewVersionUpdatedToView(undefined, false);
  });
});
export const DAPP_VERSION_DETECT_INTERVAL = IS_RUNTIME_PRODUCTION
  ? (getMainBuildInfo().buildchannel === 'prod' ? 5 : 0.5) * 60 * 1000
  : 0.1 * 60 * 1000;
interval(DAPP_VERSION_DETECT_INTERVAL).subscribe(async (count) => {
  const mainTabbedWin = await onMainWindowReady();

  const activeTab = mainTabbedWin.tabs.selected;

  console.debug(
    `[dapp-check][count:${count}] try to check current active tab dapp version...`
  );

  const selectedDappId = activeTab?.relatedDappId;
  if (
    !selectedDappId ||
    extractDappInfoFromURL(selectedDappId).type !== 'http'
  ) {
    pushNewVersionUpdatedToView(undefined, false);
    return;
  }

  const detectResult = await detectDappVersoin(selectedDappId);
  if (detectResult.result.updated) {
    console.debug(
      `[dapp-check][count:${count}] dapp updated, hash: ${detectResult.result.versionQueue[0]?.versionSha512}`
    );
  }

  pushNewVersionUpdatedToView(selectedDappId, detectResult.result.updated);
});

handleIpcMainInvoke('confirm-dapp-updated', async (_, httpDappId: string) => {
  confirmDappVersion(httpDappId);

  return {
    error: '',
    success: true,
  };
});

onIpcMainInternalEvent(
  '__internal_main:dapp:confirm-dapp-updated',
  async (httpDappId: string) => {
    confirmDappVersion(httpDappId);

    pushNewVersionUpdatedToView(httpDappId, false);
  }
);

handleIpcMainInvoke(
  '__outer_rpc:check-if-requestable',
  async (evt, reqData) => {
    const webContents = evt.sender;
    const tabbedWin = getTabbedWindowFromWebContents(webContents);
    const mainTabbedWin = await onMainWindowReady();

    if (tabbedWin !== mainTabbedWin) {
      return {
        result: false,
      };
    }

    if (
      !mainTabbedWin.tabs.selected ||
      mainTabbedWin.tabs.selected.view?.webContents?.id !== webContents.id
    )
      return { result: false };

    return {
      result: true,
    };
  }
);

onIpcMainInternalEvent(
  '__internal_main:dapps:changed',
  async ({ dapps, pinnedList, unpinnedList, protocolDappsBinding }) => {
    const [{ windowList }, { viewOnlyList }] = await Promise.all([
      getAllMainUIWindows(),
      getAllMainUIViews(),
    ]);

    const viewSet = new Set([
      ...windowList.map((win) => win.webContents),
      ...viewOnlyList.map((view) => view),
    ]);

    viewSet.forEach((webContents) => {
      sendToWebContents(webContents, '__internal_push:dapps:changed', {
        dapps,
        pinnedList,
        unpinnedList,
        protocolDappsBinding,
      });
    });
  }
);
