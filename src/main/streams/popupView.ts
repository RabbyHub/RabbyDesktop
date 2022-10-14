import { BrowserView, BrowserWindow } from "electron";
import { RABBY_ALERT_INSECURITY_URL, RABBY_SECURITY_CHECK_URL } from "../../isomorphic/constants";
import { onIpcMainEvent } from "../utils/ipcMainEvents";
import { getMainWindow } from "./tabbedBrowserWindow";

let securityCheckPopup: BrowserView;
export async function attachPopupBrowserView (
  url: string,
  isExisted = false,
  targetWin?: BrowserWindow
) {
  if (!securityCheckPopup) {
    // TODO: use standalone session open it
    securityCheckPopup = new BrowserView({
      webPreferences: {
        // session: await getTemporarySession(),
        webviewTag: true,
        sandbox: true,
        nodeIntegration: false,
        allowRunningInsecureContent: false,
        autoplayPolicy: 'user-gesture-required'
      }
    });
    securityCheckPopup.webContents.loadURL(`${RABBY_SECURITY_CHECK_URL}`);
  }

  securityCheckPopup.webContents.send('__internal_alert-security-url', { url, isExisted });

  targetWin = targetWin || (await getMainWindow()).window;

  const dispose = onIpcMainEvent('__internal_close-security-check-content', () => {
    targetWin?.removeBrowserView(securityCheckPopup);
    // destroyBrowserWebview(securityCheckPopup);

    dispose?.();
  });

  targetWin.addBrowserView(securityCheckPopup);

  const [width, height] = targetWin.getSize();

  securityCheckPopup!.setBounds({
    x: 0,
    y: 0,
    width,
    height,
  });
  securityCheckPopup!.setAutoResize({ width: true, height: true });
}

let alertView: BrowserView;
export async function attachAlertBrowserView (
  url: string, isExisted = false, targetWin?: BrowserWindow
) {
  if (!alertView) {
    // TODO: use standalone session open it
    alertView = new BrowserView({
      webPreferences: {
        // session: await getTemporarySession(),
        webviewTag: true,
        sandbox: true,
        nodeIntegration: false,
        allowRunningInsecureContent: false,
        autoplayPolicy: 'user-gesture-required'
      }
    });
    alertView.webContents.loadURL(`${RABBY_ALERT_INSECURITY_URL}?__init_url__=${encodeURIComponent(url)}`);
  }

  alertView.webContents.send('__internal_alert-security-url', { url, isExisted });

  targetWin = targetWin || (await getMainWindow()).window;

  const dispose = onIpcMainEvent('__internal_close-alert-insecure-content', () => {
    targetWin?.removeBrowserView(alertView);
    // destroyBrowserWebview(alertView);

    dispose?.();
  });

  targetWin.addBrowserView(alertView);

  const [width, height] = targetWin.getSize();

  alertView!.setBounds({
    x: 0,
    y: 0,
    width,
    height,
  });
  alertView!.setAutoResize({ width: true, height: true });
}
