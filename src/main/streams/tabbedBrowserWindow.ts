import { app, BrowserWindow, shell } from 'electron';
import * as Sentry from '@sentry/electron/main';
import { omit } from 'lodash';

import { parseQueryString } from '@/isomorphic/url';
import { arraify } from '@/isomorphic/array';
import { pickFavIconURLFromMeta } from '@/isomorphic/html';
import {
  checkoutDappURL,
  isOpenedAsHttpDappType,
  isProtocolLeaveInApp,
} from '@/isomorphic/dapp';
import {
  EnumMatchDappType,
  IS_RUNTIME_PRODUCTION,
} from '../../isomorphic/constants';
import {
  emitIpcMainEvent,
  handleIpcMainInvoke,
  onIpcMainEvent,
  onIpcMainInternalEvent,
  onIpcMainSyncEvent,
  sendToWebContents,
} from '../utils/ipcMainEvents';

import {
  getIpfsService,
  getRabbyExtViews,
  onMainWindowReady,
  pushChangesToZPopupLayer,
  RABBYX_WINDOWID_S,
  toggleMaskViaOpenedRabbyxNotificationWindow,
} from '../utils/stream-helpers';
import {
  parseRabbyxNotificationParams,
  isPopupWindowHidden,
} from '../utils/browser';
import {
  dappStore,
  findDappsById,
  findDappsByOrigin,
  getAllDapps,
} from '../store/dapps';
import { cLog } from '../utils/log';

import {
  createWindow,
  findByWindowId,
  getTabbedWindowFromWebContents,
} from '../utils/tabbedBrowserWindow';
import { safeOpenURL } from './dappSafeview';
import { isTargetScanLink } from '../store/dynamicConfig';
import { isEnableServeDappByHttp } from '../store/desktopApp';
import { checkDappEntryDirectory, CheckResultType } from '../utils/file';
import { safeRunInMainProcess } from '../utils/fn';
import { setupAppMenu } from '../browser/menu';
import { safeOpenExternalURL } from '../utils/security';

/**
 * @deprecated import members from '../utils/tabbedBrowserWindow' instead
 */
export {
  getFocusedWindow,
  getWindowFromBrowserWindow,
  findByWindowId,
  findOpenedDappTab,
  findExistedRabbyxNotificationWin,
  getTabbedWindowFromWebContents,
  isTabbedWebContents,
  createWindow,
  removeWindowRecord,
} from '../utils/tabbedBrowserWindow';

const isWin32 = process.platform === 'win32';

const rabbyxWinState = {
  signApprovalType: null as string | null,
};
export async function createRabbyxNotificationWindow({
  url,
  width,
  height,
}: {
  url: string;
  width?: number;
  height?: number;
}) {
  const mainWin = await onMainWindowReady();

  const queryObj = parseQueryString(url.split('?')[1] || '');
  rabbyxWinState.signApprovalType = queryObj.type;

  const { finalBounds: expectedBounds, shouldPosCenter } =
    parseRabbyxNotificationParams(mainWin.window, {
      signApprovalType: rabbyxWinState.signApprovalType,
      details: { width, height },
    });

  const win = await createWindow({
    defaultTabUrl: url,
    windowType: 'popup',
    webuiType: 'RabbyX-NotificationWindow',
    window: {
      frame: false,
      /**
       * @notice by default, set transparent to true will
       * lead all click behavior to be ignored (passthrough),
       *
       * but in this case, we provide a popup-view as gasket, which is
       * under this window and above the main window, so we can set
       * transparent to true and make borderless-style window.
       */
      transparent: true,
      ...(!isWin32 && {
        roundedCorners: true,
        hasShadow: false,
      }),
      x: expectedBounds.x,
      y: expectedBounds.y,
      ...(shouldPosCenter
        ? {
            center: true,
            hasShadow: isWin32,
            roundedCorners: true,
            width: expectedBounds.width,
            height: expectedBounds.height,
          }
        : {
            width: Math.min(
              width || expectedBounds.width,
              expectedBounds.width
            ),
            height: expectedBounds.height,
          }),
      movable: false,
      maximizable: false,
      minimizable: false,
      fullscreenable: false,
      resizable: false,
      parent: mainWin.window,
      type: 'popup',
    },
  });

  const windowId = win.window.id;
  win.window.on('closed', () => {
    rabbyxWinState.signApprovalType = null;
    RABBYX_WINDOWID_S.delete(windowId);
    toggleMaskViaOpenedRabbyxNotificationWindow();
  });

  win.tabs.tabList[0]?._patchWindowBuiltInMethods();

  RABBYX_WINDOWID_S.add(windowId);
  toggleMaskViaOpenedRabbyxNotificationWindow();

  return win.window as BrowserWindow;
}

onIpcMainEvent('__internal_rpc:rabbyx:close-signwin', async () => {
  RABBYX_WINDOWID_S.forEach((wid) => {
    const win = BrowserWindow.fromId(wid);
    if (win) win.close();
  });
});

handleIpcMainInvoke('get-webui-ext-navinfo', async (event, tabId) => {
  const webContents = event.sender;
  const tabbedWin = getTabbedWindowFromWebContents(webContents);
  const tab = tabbedWin?.tabs.get(tabId);
  // TODO: always respond message
  if (!tab || !tab.view) {
    throw new Error('tab not found');
  }

  const tabUrl = tab.view.webContents!.getURL();
  // const checkResult = isUrlFromDapp(tabUrl)
  //   ? await getOrPutCheckResult(tabUrl, { updateOnSet: false })
  //   : null;

  const isDestroyed = !tab.view || tab.view.webContents.isDestroyed();

  let dapp: IDapp | undefined;
  if (tabbedWin?.isMainWindow() && tab.relatedDappId) {
    dapp = findDappsById(tab.relatedDappId, getAllDapps()) || undefined;
  }

  return {
    tabNavInfo: {
      tabExists: !!tab,
      tabUrl,
      dapp,
      dappSecurityCheckResult: null,
      canGoBack: isDestroyed ? false : !!tab.view?.webContents?.canGoBack(),
      canGoForward: isDestroyed
        ? false
        : !!tab.view?.webContents?.canGoForward(),
    },
  };
});

onIpcMainEvent('__internal_rpc:browser-dev:openDevTools', (evt) => {
  if (!IS_RUNTIME_PRODUCTION) {
    const webContents = evt.sender;
    webContents.openDevTools({ mode: 'detach' });
  }
});

onIpcMainEvent('__internal_webui-window-close', (_, winId, webContentsId) => {
  const tabbedWindow = findByWindowId(winId);
  const tabToClose = tabbedWindow?.tabs.tabList.find((tab) => {
    if (tab.view && tab.view?.webContents.id === webContentsId) {
      return true;
    }
    return false;
  });
  tabToClose?.destroy();
});

handleIpcMainInvoke('safe-open-dapp-tab', async (evt, dappOrigin, opts) => {
  const result = {
    shouldNavTabOnClient: false,
    isOpenExternal: false,
    isTargetDapp: false,
    isTargetDappByOrigin: false,
    isTargetDappBySecondaryOrigin: false,
  };

  if (!isProtocolLeaveInApp(dappOrigin)) {
    safeOpenExternalURL(dappOrigin);
    return result;
  }

  if (isTargetScanLink(dappOrigin)) {
    safeOpenExternalURL(dappOrigin);
    return {
      ...result,
      isOpenExternal: true,
    };
  }
  const checkedOutDappURLInfo = checkoutDappURL(dappOrigin);
  if (isOpenedAsHttpDappType(checkedOutDappURLInfo?.type)) {
    if (!isEnableServeDappByHttp()) {
      pushChangesToZPopupLayer({
        'modal-dapp-type-not-supported': {
          visible: true,
          state: {
            tipType: checkedOutDappURLInfo?.type as IValidDappType,
          },
        },
      });
      return result;
    }

    switch (checkedOutDappURLInfo.type) {
      case 'ipfs':
      case 'ens': {
        const ipfsService = await getIpfsService();
        if (
          !checkedOutDappURLInfo.ipfsCid &&
          checkedOutDappURLInfo.type === 'ens'
        ) {
          checkedOutDappURLInfo.ipfsCid =
            findDappsById(checkedOutDappURLInfo.dappID)?.extraInfo?.ipfsCid ||
            '';
        }
        if (!(await ipfsService.isExist(checkedOutDappURLInfo.ipfsCid))) {
          pushChangesToZPopupLayer({
            'ipfs-no-local-modal': {
              visible: true,
            },
          });
          throw new Error('IPFS CID not local file found');
        }
        if (!(await ipfsService.isValid(checkedOutDappURLInfo.ipfsCid))) {
          pushChangesToZPopupLayer({
            'ipfs-verify-failed-modal': {
              visible: true,
            },
          });
          throw new Error('IPFS CID verify failed');
        }
        break;
      }
      case 'localfs': {
        const checkResult = checkDappEntryDirectory(
          checkedOutDappURLInfo.localFSPath
        );
        if (checkResult.error) {
          if (checkResult.error === CheckResultType.NO_INDEXHTML) {
            throw new Error('index.html not found for local dapp');
          } else {
            throw new Error('Local dapp entry directory invali');
          }
        }
        break;
      }
      default: {
        throw new Error(
          `Dapp with type ${checkedOutDappURLInfo.type} not supported now.`
        );
      }
    }
  }

  const currentUrl = evt.sender.getURL();
  const findResult = findDappsByOrigin(checkedOutDappURLInfo.dappOrigin);

  const isOpenAsHttp = isOpenedAsHttpDappType(checkedOutDappURLInfo?.type);
  if (isOpenAsHttp && findResult.dapp) {
    dappOrigin = checkedOutDappURLInfo.dappHttpID;
  }

  const openResult = await safeOpenURL(dappOrigin, {
    sourceURL: currentUrl,
    targetMatchedDappResult: findResult,
    isFromInternalRenderer: true,
    dontReloadOnSwitchToActiveTab: opts?.dontReloadOnSwitchToActiveTab,
  }).then((res) => {
    res.activeTab();
    return res;
  });

  const isTargetDappByOrigin = !!findResult.dappByOrigin;
  const isTargetDappBySecondaryOrigin =
    !!findResult.dappBySecondaryDomainOrigin;
  const isTargetDapp = isTargetDappByOrigin || isTargetDappBySecondaryOrigin;

  return {
    ...result,
    shouldNavTabOnClient: isOpenAsHttp || isTargetDapp,
    openType: openResult.type,
    isTargetDapp,
    isTargetDappByOrigin,
    isTargetDappBySecondaryOrigin,
  };
});

onIpcMainEvent(
  '__internal_rpc:mainwindow:stop-tab-loading',
  async (_, tabId) => {
    const mainTabbedWin = await onMainWindowReady();

    const tab = mainTabbedWin.tabs.get(tabId);
    if (!tab) return;

    tab.view?.webContents.stop();
  }
);

onIpcMainEvent(
  '__internal_rpc:mainwindow:make-sure-dapp-opened',
  async (_, dappOrigin) => {
    const tabbedWin = await onMainWindowReady();

    const foundTab = tabbedWin.tabs.findByOrigin(dappOrigin);

    if (foundTab?.id && tabbedWin.tabs.selected?.id !== foundTab.id) {
      tabbedWin.tabs.select(foundTab.id);
    }
  }
);

onMainWindowReady().then((mainTabbedWin) => {
  mainTabbedWin.tabs.on('all-tabs-destroyed', async () => {
    sendToWebContents(
      mainTabbedWin.window.webContents,
      '__internal_push:mainwindow:all-tabs-closed',
      {
        windowId: mainTabbedWin.window.id,
      }
    );
  });
});

// // performance optimization
// if (process.platform === 'win32') {
//   onMainWindowReady().then((mainTabbedWin) => {
//     const mainWindow = mainTabbedWin.window;

//     const sub = fromEvent(mainWindow, 'move')
//       .pipe(
//         bufferTime(200),
//         map((events) => events.length)
//       )
//       .subscribe((count) => {
//         const activeTab = mainTabbedWin.tabs.selected;
//         if (!mainWindow) return;
//         if (!activeTab?.view || activeTab.view.webContents.isDestroyed())
//           return;

//         if (count > 1) {
//           if (!activeTab?.view) return;
//           if (activeTab.view.webContents.isLoading()) return;

//           activeTab.hide();
//         } else {
//           if (!activeTab?.view) return;
//           activeTab.show();
//         }
//       });

//     mainWindow.on('close', () => {
//       sub.unsubscribe();
//     });
//   });
// }

onMainWindowReady().then((mainTabbedWin) => {
  const onTargetWinUpdate = () => {
    if (mainTabbedWin.window.isDestroyed()) return;

    RABBYX_WINDOWID_S.forEach((winId) => {
      const win = findByWindowId(winId)?.window;
      if (!win || win?.isDestroyed()) return;
      if (isPopupWindowHidden(win)) return;

      const bounds = win.getBounds();
      const { finalBounds } = parseRabbyxNotificationParams(
        mainTabbedWin.window,
        {
          details: {
            width: bounds.width,
            height: bounds.height,
          },
          signApprovalType: rabbyxWinState.signApprovalType,
        }
      );
      win.setBounds(finalBounds);
    });
  };

  mainTabbedWin.window.on('show', onTargetWinUpdate);
  mainTabbedWin.window.on('move', onTargetWinUpdate);
  mainTabbedWin.window.on('resize', onTargetWinUpdate);
  mainTabbedWin.window.on('unmaximize', onTargetWinUpdate);
  mainTabbedWin.window.on('restore', onTargetWinUpdate);
});

onIpcMainInternalEvent(
  '__internal_main:app:close-tab-on-del-dapp',
  async (deledDappIds) => {
    const mainWin = await onMainWindowReady();

    const dappIds = new Set(
      arraify(deledDappIds).map((id) => id.toLocaleLowerCase())
    );

    const tabsToClose = mainWin.tabs.filterTab((ctx) => {
      const checkouted = ctx.tab.relatedDappId
        ? checkoutDappURL(ctx.tab.relatedDappId)
        : null;
      return (
        !!ctx.tab.relatedDappId &&
        !!checkouted &&
        dappIds.has(checkouted.dappID)
      );
    });

    tabsToClose.forEach((tab) => {
      if (tab) {
        tab.destroy();
        cLog(`close-tab-on-del-dapp: destroyed tab ${tab.id}`);
      }
    });
  }
);

onIpcMainInternalEvent(
  '__internal_main:tabbed-window:tab-favicon-updated',
  async ({ matchedRelatedDappId, matchedType, favicons, linkRelIcons }) => {
    if (!matchedRelatedDappId || !favicons[0]) return;

    const dappsMap = dappStore.get('dappsMap');
    const dapp = dappsMap[matchedRelatedDappId];

    // TODO: should report here, we expect related dapp should exist
    if (!dapp) return;

    const toCompare = pickFavIconURLFromMeta({ favicons, linkRelIcons });
    if (!toCompare) return;

    const isSameFavicon = dapp.faviconUrl === toCompare;

    safeRunInMainProcess(() => {
      if (!isSameFavicon && dapp.type === 'http') {
        Sentry.captureEvent({
          message: `Expect: Update Dapp's faviconURL`,
          tags: {
            dappOrigin: dapp.origin,
            oldFaviconURL: dapp.faviconUrl,
            newFaviconURL: toCompare,
            hasFaviconBase64: !!dapp.faviconBase64,
          },
          extra: {
            dapp: omit(dapp, 'faviconBase64'),
            optionalFavicons: favicons,
          },
        });
      }
    });

    if (!isSameFavicon || matchedType === EnumMatchDappType.byOrigin) {
      dapp.faviconUrl = toCompare;
      dapp.faviconBase64 = '';
      dappStore.set('dappsMap', dappsMap);
    }
  }
);

onIpcMainEvent('__internal_rpc:trezor-like-window:click-close', async (evt) => {
  const { sender } = evt;
  const tabbedWin = getTabbedWindowFromWebContents(sender);
  if (!tabbedWin) return;

  tabbedWin.window.hide();

  const { backgroundWebContents } = await getRabbyExtViews();

  backgroundWebContents.executeJavaScript(`window._TrezorConnect.cancel();`);

  // backgroundWebContents.executeJavaScript(`window._OnekeyConnect.cancel();`);

  tabbedWin.tabs.destroy();
});

let tabWaitActiveMutexPools: {
  windowId: number;
  tabId: number;
  sendEvent: IpcMainSendSyncEvent<any>;
}[] = [];
onIpcMainInternalEvent(
  '__internal_main:tabbed-window:destroyed',
  (windowId) => {
    tabWaitActiveMutexPools = tabWaitActiveMutexPools.filter(
      (item) => item.windowId !== windowId
    );
  }
);
onIpcMainInternalEvent(
  '__internal_main:tabbed-window:tab-destroyed',
  (destroyedInfo) => {
    tabWaitActiveMutexPools = tabWaitActiveMutexPools.filter(
      (item) =>
        item.windowId !== destroyedInfo.windowId &&
        item.tabId !== destroyedInfo.tabId
    );
  }
);
onIpcMainSyncEvent('__outer_rpc:app:request-tab-mutex', async (evt) => {
  const callerWebContents = evt.sender;

  const tabbedWin = getTabbedWindowFromWebContents(callerWebContents);

  if (!tabbedWin) {
    evt.returnValue = { windowExisted: false };
    return;
  }

  if (tabbedWin.tabs.selected?.view?.webContents.id === callerWebContents.id) {
    evt.returnValue = { windowExisted: true };
  } else {
    tabWaitActiveMutexPools.push({
      windowId: tabbedWin.window.id,
      tabId: callerWebContents.id,
      sendEvent: evt,
    });
  }
});
onIpcMainInternalEvent(
  '__internal_main:tabbed-window:tab-selected',
  (selectedInfo) => {
    const waitOne = tabWaitActiveMutexPools.find(
      (item) =>
        item.windowId === selectedInfo.windowId &&
        item.tabId === selectedInfo.tabId
    );
    if (!waitOne) return;
    if (waitOne.sendEvent.sender.isDestroyed()) return;

    waitOne.sendEvent.returnValue = { windowExisted: true };
  }
);

onMainWindowReady().then(async (mainTabbedWin) => {
  mainTabbedWin.tabs.on('tab-selected-changed', (payload) => {
    setupAppMenu();
  });
});

app.on('quit', async () => {
  const mainTabbedWin = await onMainWindowReady();

  const allOpenedTabs = mainTabbedWin.tabs.tabList;

  const lastOpenInfos: IDappLastOpenInfo[] = [];
  allOpenedTabs.forEach((tab) => {
    const lastOpenInfo = tab.makeTabLastOpenInfo()!;

    if (lastOpenInfo) {
      lastOpenInfos.push(lastOpenInfo);
    }
  });

  emitIpcMainEvent('__internal_main:mainwindow:dapp-tabs-to-be-closed', {
    tabs: lastOpenInfos,
  });
});
