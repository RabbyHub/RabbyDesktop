import { getFullAppProxyConf } from '../store/desktopApp';
import { safeCapturePage } from '../utils/dapps';
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
