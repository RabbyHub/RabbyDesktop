import { pickFavIconURLFromMeta } from '@/isomorphic/html';
import { checkUrlViaBrowserView } from '../utils/appNetwork';
import { safeCapturePage } from '../utils/dapps';
import {
  handleIpcMainInvoke,
  onIpcMainInternalEvent,
  sendToWebContents,
} from '../utils/ipcMainEvents';
import {
  getAllMainUIViews,
  getAllMainUIWindows,
  getSessionInsts,
  onMainWindowReady,
} from '../utils/stream-helpers';
import { getTabbedWindowFromWebContents } from './tabbedBrowserWindow';

handleIpcMainInvoke('parse-favicon', async (_, targetURL) => {
  const result = {
    error: null,
    metaData: null as ISiteMetaData | null,
  };

  let fallbackFavicon: string | undefined;
  let targetMetadata: ISiteMetaData | undefined;
  const { mainSession } = await getSessionInsts();
  await checkUrlViaBrowserView(targetURL, {
    session: mainSession,
    onMetaDataUpdated: (meta) => {
      fallbackFavicon = pickFavIconURLFromMeta(meta);

      targetMetadata = meta;
    },
    timeout: 8 * 1e3,
  });

  result.metaData = targetMetadata || null;

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
