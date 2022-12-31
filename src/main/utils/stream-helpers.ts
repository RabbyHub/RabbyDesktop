import { firstValueFrom } from 'rxjs';
import { fromMainSubject } from '../streams/_init';

export async function getElectronChromeExtensions() {
  return firstValueFrom(fromMainSubject('electronChromeExtensionsReady'));
}

export async function getWebuiExtension() {
  return firstValueFrom(fromMainSubject('webuiExtensionReady'));
}

export async function getWebuiExtId() {
  return (await getWebuiExtension()).id;
}

export async function onMainWindowReady(): Promise<
  import('../browser/browsers').default
> {
  return firstValueFrom(fromMainSubject('mainWindowReady'));
}

export async function getRabbyExtId() {
  const ext = await firstValueFrom(fromMainSubject('rabbyExtensionReady'));

  return ext.id;
}

export async function getRabbyExtViews() {
  return firstValueFrom(fromMainSubject('rabbyExtViews'));
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
      rabbyNotificationGasket.setBounds({ x: 0, y: 0, width, height });
    } else {
      rabbyNotificationGasket.setBounds({
        x: -99999,
        y: -99999,
        width,
        height,
      });
      mainWin.removeBrowserView(rabbyNotificationGasket);
    }
  }
}
