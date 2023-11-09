import { isEnableServeDappByHttp } from '../store/desktopApp';
import { createWindow } from '../streams/tabbedBrowserWindow';
import {
  forwardMessageToWebContents,
  getZPopupLayerWebContents,
  onMainWindowReady,
  pushChangesToZPopupLayer,
} from './stream-helpers';

function getConnectWinSize(
  pWinBounds: Pick<Electron.Rectangle, 'width' | 'height'>
) {
  return {
    width: Math.max(pWinBounds.width - 400, 900),
    height: Math.max(Math.floor(pWinBounds.height * 0.8), 700),
  };
}

function updateSubWindowRect(
  parentWin: Electron.BrowserWindow,
  window: Electron.BrowserWindow
) {
  if (window.isDestroyed()) return;

  const pWinBounds = parentWin.getBounds();
  const selfWinBounds = window.getBounds();

  const popupRect = {
    ...selfWinBounds,
    ...getConnectWinSize(pWinBounds),
  };

  // make it centered
  let x = pWinBounds.x + (pWinBounds.width - popupRect.width) / 2;
  let y = pWinBounds.y + (pWinBounds.height - popupRect.height) / 2;

  // Convert to ints
  x = Math.floor(x);
  y = Math.floor(y);

  window.setBounds({ ...popupRect, x, y }, true);
}

const trezorLikeState = {
  openedType: null as IHardwareConnectPageType | null,
};
export function getTrezorLikeCannotUse(openType: IHardwareConnectPageType) {
  const reasons: ITrezorLikeCannotUserReason[] = [];

  if (isEnableServeDappByHttp()) {
    reasons.push({
      reasonType: 'enabled-ipfs',
      cannotUse: openType,
    });
  }

  return reasons;
}

export function alertCannotUseDueTo(reason?: ITrezorLikeCannotUserReason) {
  if (reason?.reasonType === 'enabled-ipfs') {
    pushChangesToZPopupLayer({
      'trezor-like-cannot-use': {
        visible: true,
        state: reason,
      },
    });
  }
}

type IStopResult = {
  stopped: boolean;
  nextFunc: (() => void) | undefined;
};
export function stopOpenConnectHardwareWindow(
  matches: IHardwareConnectPageMatches
): IStopResult {
  const result: IStopResult = {
    stopped: false,
    nextFunc: undefined,
  };

  if (matches.isTrezorLike) {
    const reasons = getTrezorLikeCannotUse(matches.type);

    if (trezorLikeState.openedType) {
      const reason = reasons[0];
      if (reason) {
        result.stopped = true;
        result.nextFunc = () => {
          alertCannotUseDueTo(reason);
        };
      }
    }
  }

  return result;
}

export function asyncDestroyWindowIfCannotUseTrezorLike(options: {
  openType: IHardwareConnectPageType;
  hwConnectWindow: Electron.BrowserWindow;
  timeoutVal?: number;
}) {
  const connWindow = options.hwConnectWindow;
  const timeoutVal = options.timeoutVal || 250;

  if (isEnableServeDappByHttp()) {
    connWindow.hide();

    setTimeout(() => {
      connWindow.destroy();
      alertCannotUseDueTo({
        reasonType: 'enabled-ipfs',
        cannotUse: options.openType,
      });
    }, timeoutVal);
  }
}

/**
 * @description it must be one tabbed window which is:
 *
 * 1. charged by rabbyx extension
 * 2. support chrome.tabs.* APIs
 */
export async function createHardwareConnectPageWindow(
  connectURL: string,
  matches: IHardwareConnectPageMatches
) {
  const mainWindow = (await onMainWindowReady()).window;

  const tabbedWin = await createWindow({
    defaultTabUrl: connectURL,
    defaultOpen: false,
    webuiType: 'ForSpecialHardware',
    window: {
      parent: mainWindow,
      modal: false,
      center: true,
      type: 'popup',
      ...getConnectWinSize(mainWindow.getBounds()),
      closable: true,
      movable: false,
      minimizable: false,
      maximizable: false,
      resizable: false,
      fullscreenable: false,
      ...(matches.isTrezorLike && {
        backgroundColor: 'white',
      }),
      // frame: true,
      // trafficLightPosition: { x: 10, y: 10 }
    },
  });

  pushChangesToZPopupLayer({
    'gasket-modal-like-window': {
      visible: true,
    },
  });

  const zPopupWc = await getZPopupLayerWebContents();
  const hdManagerType =
    matches.type === 'gridplus'
      ? 'GridPlus'
      : matches.type === 'onekey'
      ? 'Onekey'
      : 'Trezor';

  forwardMessageToWebContents(zPopupWc, {
    targetView: 'z-popup',
    type: 'hardward-conn-window-opened-changed',
    payload: {
      opened: true,
      type: hdManagerType,
    },
  });

  const tab = await tabbedWin.createTab({
    topbarStacks: {
      tabs: false,
      navigation: false,
    },
  });

  trezorLikeState.openedType = matches.type;

  const connWindow = tabbedWin.window;

  // // hook native close button
  // connWindow.on('close', (evt) => {
  //   evt.preventDefault();
  //   tab.destroy();

  //   // TODO: how could we make sure trigger required event on close?
  //   // connWindow.webContents.executeJavaScript('window.close()');

  //   return false;
  // });

  connWindow.on('closed', async () => {
    // const { backgroundWebContents } = await getRabbyExtViews();
    // backgroundWebContents.executeJavaScript(`window._TrezorConnect.dispose();`);
    // // backgroundWebContents.executeJavaScript(`window._TrezorConnect.cancel();`);
    pushChangesToZPopupLayer({
      'gasket-modal-like-window': {
        visible: false,
      },
    });
    forwardMessageToWebContents(zPopupWc, {
      targetView: 'z-popup',
      type: 'hardward-conn-window-opened-changed',
      payload: {
        opened: false,
        type: hdManagerType,
      },
    });
  });

  mainWindow.on('close', () => {
    if (connWindow.isDestroyed()) return;
    connWindow?.close();
  });
  updateSubWindowRect(mainWindow, connWindow);
  const onMainWindowUpdate = () => {
    // if (connWindow.isVisible())
    //   hidePopupOnMainWindow(connWindow, 'sidebar-dapp-contextmenu');
    updateSubWindowRect(mainWindow, connWindow);
  };
  mainWindow.on('show', onMainWindowUpdate);
  mainWindow.on('move', onMainWindowUpdate);
  mainWindow.on('resized', onMainWindowUpdate);
  mainWindow.on('unmaximize', onMainWindowUpdate);
  mainWindow.on('restore', onMainWindowUpdate);

  return {
    window: connWindow,
    tab,
    asyncDestroyWindowIfNeed: () => {
      if (!matches.isTrezorLike) return;

      asyncDestroyWindowIfCannotUseTrezorLike({
        hwConnectWindow: connWindow,
        openType: matches.type,
        timeoutVal: 250,
      });
    },
  };
}
