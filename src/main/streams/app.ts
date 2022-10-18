import { app, BrowserView, BrowserWindow, Tray } from "electron";
import { firstValueFrom } from "rxjs";

import { APP_NAME, IS_RUNTIME_PRODUCTION, RABBY_ALERT_INSECURITY_URL, RABBY_GETTING_STARTED_URL, RABBY_HOMEPAGE_URL, RABBY_SPALSH_URL } from "../../isomorphic/constants";
import { isRabbyShellURL, isUrlFromDapp } from "../../isomorphic/url";
import buildChromeContextMenu from "../browser/context-menu";
import { setupMenu } from '../browser/menu';
import { desktopAppStore } from "../store/desktopApp";
import { getAssetPath, getBrowserWindowOpts } from "../utils/app";
import { onIpcMainEvent } from "../utils/ipcMainEvents";
import { getBindLog } from "../utils/log";
import { getChromeExtensions } from "./session";
import { createWindow, getFocusedWindow, getWindowFromBrowserWindow, getWindowFromWebContents } from "./tabbedBrowserWindow";
import { getWebuiExtId } from "./session";
import { fromMainSubject, valueToMainSubject } from "./_init";
import { dappStore, formatDapps, parseDappUrl } from '../store/dapps';
import { attachAlertBrowserView, attachDappSecurityCheckView } from "./popupView";

const appLog = getBindLog('appStream', 'bgGrey');

const isDarwin = process.platform === 'darwin';
const getTrayIconByTheme = () => {
  if (!isDarwin)
    return getAssetPath('app-icons/win32-tray-logo.png')

  return getAssetPath('app-icons/macosIconTemplate@2x.png');
}

app.on('web-contents-created', (evt, webContents) => {
  const type = webContents.getType();
  const url = webContents.getURL();
  appLog(`'web-contents-created' event [type:${type}, url:${url}]`);

  // TODO: use other params to activate
  if (process.env.SHELL_DEBUG && webContents.getType() === 'backgroundPage') {
    webContents.openDevTools({ mode: 'detach', activate: true });
  }

  webContents.setWindowOpenHandler((details) => {
    const currentUrl = webContents.getURL();
    const isFromDapp = isUrlFromDapp(currentUrl);
    const dapps = formatDapps(dappStore.get('dapps'));

    const currentInfo = parseDappUrl(currentUrl, dapps);
    const targetInfo = parseDappUrl(details.url, dapps);
    const sameOrigin = currentInfo.origin === targetInfo.origin

    if (isFromDapp && !sameOrigin) {
      attachAlertBrowserView(details.url, targetInfo.existedOrigin, getWindowFromWebContents(webContents)?.window);
    } else {
      switch (details.disposition) {
        case 'foreground-tab':
        case 'background-tab':
        case 'new-window': {
          const tabbedWin = getWindowFromWebContents(webContents);

          const openedTab = tabbedWin?.tabs.findByOrigin(details.url) || null;
          if (openedTab) {
            tabbedWin?.tabs.select(openedTab!['id'])
            openedTab!.loadURL(details.url);
          } else {
            const targetWin = tabbedWin?.window;
            // TODO: do security check
            attachDappSecurityCheckView(details.url, targetWin)
              .then(({ continualOpenId }) => {
                const disposeContinueOpenDapp = onIpcMainEvent('__internal_rpc:security-check:continue-open-dapp', (_evt, _openId, _openUrl) => {
                  if (targetWin && _openId === continualOpenId) {
                    disposeContinueOpenDapp?.();
                    const tab = tabbedWin?.tabs.create();
                    tab?.loadURL(details.url);
                  }
                });

                targetWin?.once('closed', () => {
                  disposeContinueOpenDapp?.();
                });
              });
          }
          break;
        }
        default: {
          break;
        }
      }
    }

    return {
      action: 'deny',
    }
  })

  webContents.on('context-menu', async (_, params) => {
    const pageURL = params.pageURL || ''
    // it's shell
    if (isRabbyShellURL(pageURL) && IS_RUNTIME_PRODUCTION) return ;

    const menu = buildChromeContextMenu({
      params,
      webContents,
      extensionMenuItems: (await getChromeExtensions()).getContextMenuItems(
        webContents,
        params
      ),
      openLink: (winURL, disposition) => {
        const win = getFocusedWindow();

        switch (disposition) {
          case 'new-window':
            createWindow({ defaultTabUrl: winURL });
            break;
          default: {
            const tab = win.tabs.create();
            tab.loadURL(winURL);
            break;
          }
        }
      },
    });

    menu.popup();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});

export default function bootstrap () {
  // eslint-disable-next-line promise/catch-or-return
  app.whenReady().then(async () => {
    app.setPath(
      'userData',
      app.getPath('userData').replace('Electron', APP_NAME)
    );
    if (!IS_RUNTIME_PRODUCTION) {
      // we just need to modify it for development, because `APP_NAME` in production is from package.json
      app.setName(APP_NAME);
    }

    valueToMainSubject('userAppReady', void 0);

    appLog('::init', 'app ready, paths:');
    appLog('::init', `desktop's home: ${app.getPath('home')}`);
    appLog('::init', `desktop's appData: ${app.getPath('appData')}`);
    appLog('::init', `desktop's userData: ${app.getPath('userData')}`);

    set_menu_and_icons: {
      getWebuiExtId().then(id => {
        setupMenu({
          getFocusedWebContents: () => {
            return getFocusedWindow().getFocusedTab()?.webContents;
          },
          topbarExtId: id,
        });
      })

      if (isDarwin) {
        app.dock.setIcon(getAssetPath('icon.png'))
      }

      const appTray = new Tray(getTrayIconByTheme());
      // do quit on context menu
      appTray.addListener('click', () => {
        showMainWin();
      });
    }

    // wait main subject ready
    await firstValueFrom(fromMainSubject('sessionReady'));

    // init window
    const mainWin = await createWindow({
      defaultTabUrl: RABBY_HOMEPAGE_URL,
      window: {
        show: false,
      }
    });

    const showMainWin = () => {
      mainWin.window.show();
      mainWin.window.moveTop();
    };

    const splashWin = new BrowserWindow(getBrowserWindowOpts({
      width: 500,
      height: 300,
      minHeight: undefined,
      minWidth: undefined,
      resizable: false,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
    }, { zeroMinSize: true }));
    splashWin.webContents.loadURL(RABBY_SPALSH_URL);

    let gettingStartedWin: BrowserWindow | null = null;

    onIpcMainEvent('redirect-mainWindow', () => {
      if (!gettingStartedWin) return ;

      gettingStartedWin.destroy();
      showMainWin();
      gettingStartedWin = null;
    });

    // do this work on mainWin.window postMessage('homePageLoaded') until timeout
    setTimeout(() => {
      splashWin.destroy();

      if (desktopAppStore.get('firstStartApp')) {
        gettingStartedWin = new BrowserWindow({
          ...getBrowserWindowOpts(),
          transparent: true,
          frame: false,
          resizable: false,
        });
        gettingStartedWin.webContents.loadURL(RABBY_GETTING_STARTED_URL);
      } else {
        showMainWin();
      }
    }, IS_RUNTIME_PRODUCTION ? 3000 : 200);
  });
}
