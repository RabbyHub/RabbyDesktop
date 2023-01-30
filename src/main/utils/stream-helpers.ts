import { firstValueFrom, lastValueFrom } from 'rxjs';
import { fromMainSubject, valueToMainSubject } from '../streams/_init';

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

export async function getContextMenuPopupWindow() {
  return firstValueFrom(fromMainSubject('contextMenuPopupWindowReady'));
}

export const RABBYX_WINDOWID_S = new Set<number>();
export async function toggleMaskViaOpenedRabbyxNotificationWindow() {
  const { window: mainWin } = await onMainWindowReady();
  const { rabbyNotificationGasket } = await getRabbyExtViews();

  if (!mainWin.isDestroyed()) {
    const [width, height] = mainWin.getSize();

    if (RABBYX_WINDOWID_S.size) {
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

export async function getAllMainUIViews() {
  const [
    mainWin,
    { addAddress, addressManagement, quickSwap, dappsManagement },
  ] = await Promise.all([
    await onMainWindowReady(),
    await firstValueFrom(fromMainSubject('popupViewsOnMainwinReady')),
  ]);

  const views = {
    'add-address': addAddress,
    'address-management': addressManagement,
    'quick-swap': quickSwap,
    'dapps-management': dappsManagement,
  } as const;

  const viewOnlyHash = {
    addAddress: addAddress.webContents,
    addressManagement: addressManagement.webContents,
    quickSwap: quickSwap.webContents,
    dappsManagement: dappsManagement.webContents,
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
