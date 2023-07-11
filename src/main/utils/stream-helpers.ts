import { firstValueFrom, lastValueFrom } from 'rxjs';
import { fromMainSubject, valueToMainSubject } from '../streams/_init';
import { emitIpcMainEvent } from './ipcMainEvents';

export async function getElectronChromeExtensions() {
  return firstValueFrom(fromMainSubject('electronChromeExtensionsReady'));
}

export async function getWebuiExtension() {
  return firstValueFrom(fromMainSubject('webuiExtensionReady'));
}

export async function getWebuiExtId() {
  return (await getWebuiExtension()).id;
}

export async function getWebuiURLBase() {
  const extId = (await getWebuiExtension()).id;
  return `chrome-extension://${extId}`;
}

export async function onMainWindowReady(): Promise<
  import('../browser/browsers').MainTabbedBrowserWindow
> {
  return firstValueFrom(fromMainSubject('mainWindowReady'));
}

export async function forwardToMainWebContents<
  T extends IChannelsKey = IChannelsKey
>(
  eventName: T,
  payload: ChannelMessagePayload[T] extends void
    ? null
    : ChannelMessagePayload[T]['response'][0]
) {
  const mainWin = await onMainWindowReady();
  mainWin.window.webContents.send(eventName, payload);
}

export async function getRabbyExtId() {
  const ext = await firstValueFrom(fromMainSubject('rabbyExtensionLoaded'));

  return ext.id;
}

export async function getRabbyExtViews() {
  return firstValueFrom(fromMainSubject('rabbyExtViews'));
}

export async function getSessionInsts() {
  return firstValueFrom(fromMainSubject('sessionReady'));
}

export async function getDappSafeView() {
  return firstValueFrom(fromMainSubject('dappSafeModeViews'));
}

export async function getDappLoadingView() {
  return firstValueFrom(fromMainSubject('dappLoadingView'));
}

export async function getPopupWindowOnMain() {
  return firstValueFrom(fromMainSubject('popupWindowOnMain'));
}

export async function __internalToggleRabbyxGasketMask(nextShow: boolean) {
  const { window: mainWin } = await onMainWindowReady();
  const { rabbyNotificationGasket } = await getRabbyExtViews();

  if (!mainWin.isDestroyed()) {
    const [width, height] = mainWin.getSize();

    if (nextShow) {
      mainWin.addBrowserView(rabbyNotificationGasket);
      mainWin.setTopBrowserView(rabbyNotificationGasket);
      mainWin.setResizable(false);
      rabbyNotificationGasket.setBounds({
        x: 0,
        y: 0,
        width,
        height,
      });
    } else {
      rabbyNotificationGasket.setBounds({
        x: -99999,
        y: -99999,
        width,
        height,
      });
      mainWin.setResizable(true);
      mainWin.removeBrowserView(rabbyNotificationGasket);
    }
  }
}

export const RABBYX_WINDOWID_S = new Set<number>();
export async function toggleMaskViaOpenedRabbyxNotificationWindow() {
  __internalToggleRabbyxGasketMask(RABBYX_WINDOWID_S.size > 0);
}

const INIT_ACTIVE_TAB_RECT: IMainWindowActiveTabRect = {
  dappViewState: 'unmounted',
};

export async function getMainWindowActiveTabRect() {
  return (
    lastValueFrom(fromMainSubject('mainWindowActiveTabRect')) ||
    INIT_ACTIVE_TAB_RECT
  );
}

export function updateMainWindowActiveTabRect(
  rectState: IMainWindowActiveTabRect
) {
  valueToMainSubject('mainWindowActiveTabRect', rectState);
}

export async function getAllMainUIWindows() {
  const [mainTabbedWin, { sidebarContext, ghostFloatingWindow }] =
    await Promise.all([
      await onMainWindowReady(),
      await firstValueFrom(fromMainSubject('popupWindowOnMain')),
    ]);

  const popupOnly: Record<IPopupWinPageInfo['type'], Electron.BrowserWindow> = {
    'sidebar-dapp-contextmenu': sidebarContext,
    'top-ghost-window': ghostFloatingWindow,
  } as const;

  const windows = {
    'main-window': mainTabbedWin.window,
    ...popupOnly,
  } as const;

  return {
    mainTabbedWin,
    windows,
    popupOnly,
    windowList: Object.values(windows),
  };
}

export async function getAllMainUIViews() {
  const [mainWin, mainViews] = await Promise.all([
    await onMainWindowReady(),
    await firstValueFrom(fromMainSubject('popupViewsOnMainwinReady')),
  ]);

  const views: Record<PopupViewOnMainwinInfo['type'], Electron.BrowserView> = {
    'dapps-management': mainViews.dappsManagement,
    'select-devices': mainViews.selectDevices,
    'select-camera': mainViews.selectCamera,
    'z-popup': mainViews.zPopup,
    'global-toast-popup': mainViews.globalToastPopup,
    'in-dapp-find': mainViews.inDappFind,
    'right-side-popup': mainViews.rightSidePopup,
  };

  const viewOnlyHash = {
    dappsManagement: mainViews.dappsManagement.webContents,
    selectDevices: mainViews.selectDevices.webContents,
    zPopup: mainViews.zPopup.webContents,
    globalToastPopup: mainViews.globalToastPopup.webContents,
    inDappFind: mainViews.inDappFind.webContents,
    rightSidePopup: mainViews.rightSidePopup.webContents,
  };

  const hash = {
    mainWindow: mainWin.window.isDestroyed()
      ? null
      : mainWin.window.webContents,
    ...viewOnlyHash,
  };

  return {
    views,
    viewOnlyHash,
    viewOnlyList: Object.values(viewOnlyHash),
    hash,
    list: Object.values(hash).filter(Boolean) as Electron.WebContents[],
  };
}

export async function getZPopupLayerWebContents() {
  const { viewOnlyHash } = await getAllMainUIViews();
  return viewOnlyHash.zPopup;
}

export async function pushChangesToZPopupLayer(
  partials: (ChannelForwardMessageType & {
    type: 'update-subview-state';
  })['partials']
) {
  const { viewOnlyHash } = await getAllMainUIViews();

  viewOnlyHash.zPopup.send('__internal_forward:views:channel-message', {
    targetView: 'z-popup',
    type: 'update-subview-state',
    partials,
  });
}

export async function forwardMessageToWebContents(
  wc: Electron.WebContents,
  payload: ChannelForwardMessageType
) {
  wc.send('__internal_forward:views:channel-message', payload);
}

export function startSelectDevices(selectId: string) {
  pushChangesToZPopupLayer({
    'gasket-modal-like-window': {
      visible: true,
    },
  });
  emitIpcMainEvent('__internal_main:popupview-on-mainwin:toggle-show', {
    nextShow: true,
    type: 'select-devices',
    pageInfo: {
      type: 'select-devices',
      state: {
        selectId,
        status: 'pending',
      },
    },
  });

  getZPopupLayerWebContents().then((zPopupWc) => {
    forwardMessageToWebContents(zPopupWc, {
      targetView: 'z-popup',
      type: 'hardward-conn-window-opened-changed',
      payload: { opened: true, type: 'Ledger' },
    });
  });
}

export function stopSelectDevices() {
  getZPopupLayerWebContents().then((zPopupWc) => {
    forwardMessageToWebContents(zPopupWc, {
      targetView: 'z-popup',
      type: 'hardward-conn-window-opened-changed',
      payload: { opened: false, type: 'Ledger' },
    });
  });
  emitIpcMainEvent('__internal_main:popupview-on-mainwin:toggle-show', {
    nextShow: false,
    type: 'select-devices',
  });
  pushChangesToZPopupLayer({
    'gasket-modal-like-window': {
      visible: false,
    },
  });
}

export function toggleSelectCamera(selectId: string, nextShow = true) {
  if (nextShow) {
    emitIpcMainEvent('__internal_main:popupview-on-mainwin:toggle-show', {
      nextShow: true,
      type: 'select-camera',
      pageInfo: {
        type: 'select-camera',
        state: {
          selectId,
          status: 'pending',
        },
      },
    });
  } else {
    emitIpcMainEvent('__internal_main:popupview-on-mainwin:toggle-show', {
      nextShow: false,
      type: 'select-camera',
    });
  }
}

export async function getAppRuntimeProxyConf() {
  return firstValueFrom(fromMainSubject('appRuntimeProxyConf'));
}

export async function getIpfsService() {
  return firstValueFrom(fromMainSubject('ipfsServiceReady'));
}

const debugStates: IDebugStates = {
  isGhostWindowDebugHighlighted: false,
};
export async function getOrSetDebugStates(
  partials?:
    | Partial<IDebugStates>
    | ((prevStates: IDebugStates) => Partial<IDebugStates>)
) {
  const prevStates = { ...debugStates };

  if (partials) {
    partials =
      typeof partials === 'function' ? partials({ ...prevStates }) : partials;
    Object.assign(debugStates, partials);
  }

  return { prevStates, nextStates: debugStates };
}

export async function getAppTray() {
  return firstValueFrom(fromMainSubject('appTray'));
}
