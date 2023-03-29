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
  import('../browser/browsers').default
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
  const [mainWin, { sidebarContext }] = await Promise.all([
    await onMainWindowReady(),
    await firstValueFrom(fromMainSubject('popupWindowOnMain')),
  ]);

  const popupOnly: Record<IPopupWinPageInfo['type'], Electron.BrowserWindow> = {
    'sidebar-dapp': sidebarContext,
  } as const;

  const windows = {
    'main-window': mainWin.window,
    ...popupOnly,
  } as const;

  return {
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
    'add-address-dropdown': mainViews.addAddress,
    'dapps-management': mainViews.dappsManagement,
    'select-devices': mainViews.selectDevices,
    'z-popup': mainViews.zPopup,
    'global-toast-popup': mainViews.globalToastPopup,
    'in-dapp-find': mainViews.inDappFind,
  };

  const viewOnlyHash = {
    addAddress: mainViews.addAddress.webContents,
    dappsManagement: mainViews.dappsManagement.webContents,
    selectDevices: mainViews.selectDevices.webContents,
    zPopup: mainViews.zPopup.webContents,
    globalToastPopup: mainViews.globalToastPopup.webContents,
    inDappFind: mainViews.inDappFind.webContents,
  };

  const hash = {
    mainWindow: mainWin.window.webContents,
    ...viewOnlyHash,
  };

  return {
    views,
    viewOnlyHash,
    viewOnlyList: Object.values(viewOnlyHash),
    hash,
    list: Object.values(hash),
  };
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
}

export function stopSelectDevices() {
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

export async function getAppRuntimeProxyConf() {
  return firstValueFrom(fromMainSubject('appRuntimeProxyConf'));
}
