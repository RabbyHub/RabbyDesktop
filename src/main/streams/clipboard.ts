import { app, BrowserView, BrowserWindow, clipboard } from "electron";
import { firstValueFrom, interval, Subscription } from "rxjs";
import { distinctUntilChanged, filter, map } from 'rxjs/operators';

import { IS_RUNTIME_PRODUCTION, RABBY_POPUP_GHOST_VIEW_URL } from "../../isomorphic/constants";
import { NATIVE_HEADER_WITH_NAV_H, SECURITY_NOTIFICATION_VIEW_WIDTH } from "../../isomorphic/const-size";
import { cLog } from '../utils/log';
import { onIpcMainEvent } from "../utils/ipcMainEvents";
import { getMainWindow, onMainWindowReady } from "./tabbedBrowserWindow";
import { fromMainSubject, valueToMainSubject } from "./_init";

const clipboardText$ = interval(300).pipe(
  map(() => clipboard.readText('clipboard'))
);

const clipboardChanged$ = clipboardText$.pipe(
  distinctUntilChanged((prev, cur) => prev === cur)
);

const WEB3_ADDR_REGEX = /(0x[a-fA-F0-9]{40})/;
// checkout one web3 ens address
const clipboardTextWithWeb3Addrs$ = clipboardChanged$.pipe(
  filter((text) => {
    return !WEB3_ADDR_FULL_REGEX.test(text) && WEB3_ADDR_REGEX.test(text);
  }),
  map(text => {
    return {
      fullText: text,
      web3Addr: text.match(WEB3_ADDR_REGEX)![0]
    }
  })
)

const WEB3_ADDR_FULL_REGEX = /^0x[a-fA-F0-9]{40}$/;
const clipboardFullWeb3Addrs$ = clipboardChanged$.pipe(
  filter((text) => {
    return WEB3_ADDR_FULL_REGEX.test(text.trim());
  })
)

let subs: Subscription[] = []

subs = subs.concat(
  clipboardChanged$.subscribe(async (text) => {
    // cLog('[feat] latestValue is', text);
  }),

  clipboardTextWithWeb3Addrs$.subscribe(async ({ fullText, web3Addr }) => {
    // cLog('[feat] with web3Addr is', web3Addr);
  }),

  clipboardFullWeb3Addrs$.subscribe(async (web3Addr) => {
    // cLog('[feat] full web3Addr is', web3Addr);

    attachClipboardSecurityNotificationView(web3Addr);
  }),
);

app.on('will-quit', () => {
  subs.forEach(sub => sub.unsubscribe());
});

onMainWindowReady().then(async (mainWin) => {
  const targetWin = mainWin.window;
  const [width, height] = targetWin.getSize();

  const secNotifications = new BrowserView({
    webPreferences: {
      webviewTag: true,
      sandbox: true,
      nodeIntegration: false,
      allowRunningInsecureContent: false,
      autoplayPolicy: 'user-gesture-required'
    }
  });

  secNotifications.setBounds({
    x: width - SECURITY_NOTIFICATION_VIEW_WIDTH,
    y: NATIVE_HEADER_WITH_NAV_H,
    width: SECURITY_NOTIFICATION_VIEW_WIDTH,
    height: height - NATIVE_HEADER_WITH_NAV_H,
  });
  secNotifications.setAutoResize({ width: true, height: true });

  // add to main window then remove
  targetWin.addBrowserView(secNotifications);
  secNotifications.webContents.loadURL(`${RABBY_POPUP_GHOST_VIEW_URL}#/security-notifications`);
  targetWin.removeBrowserView(secNotifications);

  if (!IS_RUNTIME_PRODUCTION) {
    secNotifications.webContents.openDevTools({ mode: 'detach' });
  }

  valueToMainSubject('securityNotificationsViewReady', secNotifications);
})

async function attachClipboardSecurityNotificationView (
  web3Addr: string,
  targetWin?: BrowserWindow
) {
  targetWin = targetWin || (await getMainWindow()).window;
  // const continualOpenId = randString();

  const securityNotifyPopup = await firstValueFrom(fromMainSubject('securityNotificationsViewReady'));

  securityNotifyPopup.webContents.send('__internal_rpc:clipboard:full-web3-addr', { web3Address: web3Addr });

  onIpcMainEvent('__internal_rpc:clipboard:close-view', () => {
    targetWin?.removeBrowserView(securityNotifyPopup);
  });
  targetWin.addBrowserView(securityNotifyPopup);
}
