import { BrowserView, BrowserWindow } from "electron";
import { RABBY_ALERT_INSECURITY_URL } from "../../isomorphic/constants";
import { onIpcMainEvent } from "../utils/ipcMainEvents";
import { getMainWindow } from "./tabbedBrowserWindow";

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
