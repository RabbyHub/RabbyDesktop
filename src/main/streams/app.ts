import { app, BrowserView, BrowserWindow, Tray } from 'electron';

import { formatDapps } from '@/isomorphic/dapp';
import {
  APP_NAME,
  IS_RUNTIME_PRODUCTION,
  RABBY_GETTING_STARTED_URL,
  RABBY_SPALSH_URL,
} from '../../isomorphic/constants';
import {
  isRabbyExtBackgroundPage,
  isRabbyShellURL,
  isUrlFromDapp,
} from '../../isomorphic/url';
import buildChromeContextMenu from '../browser/context-menu';
import { setupMenu } from '../browser/menu';
import {
  desktopAppStore,
  getOrInitMainWinPosition,
  storeMainWinPosition,
} from '../store/desktopApp';
import { getAssetPath, getBrowserWindowOpts } from '../utils/app';
import { onIpcMainEvent } from '../utils/ipcMainEvents';
import { getBindLog } from '../utils/log';
import { defaultSessionReadyThen } from './session';
import {
  createWindow,
  getFocusedWindow,
  getTabbedWindowFromWebContents,
} from './tabbedBrowserWindow';
import { valueToMainSubject } from './_init';
import { dappStore, parseDappUrl } from '../store/dapps';
import { attachAlertBrowserView } from './dappAlert';
import { openDappSecurityCheckView } from './securityCheck';
import {
  getElectronChromeExtensions,
  getWebuiExtId,
  onMainWindowReady,
  getRabbyExtId,
  getRabbyExtViews,
} from '../utils/stream-helpers';
import { switchToBrowserTab } from '../utils/browser';

const appLog = getBindLog('appStream', 'bgGrey');

const isDarwin = process.platform === 'darwin';
const getTrayIconByTheme = () => {
  if (!isDarwin) return getAssetPath('app-icons/win32-tray-logo.png');

  return getAssetPath('app-icons/macosIconTemplate@2x.png');
};

app.on('web-contents-created', async (evtApp, webContents) => {
  const type = webContents.getType();
  const wcUrl = webContents.getURL();
  appLog(`'web-contents-created' event [type:${type}, url:${wcUrl}]`);

  // TODO: use other params to activate
  if (process.env.SHELL_DEBUG && webContents.getType() === 'backgroundPage') {
    webContents.openDevTools({ mode: 'detach', activate: true });
  }

  const mainTabbedWin = await onMainWindowReady();
  const rabbyExtId = await getRabbyExtId();

  webContents.on('will-redirect', (evt) => {
    const sender = (evt as any).sender as BrowserView['webContents'];
    const url = sender.getURL();

    // this tabs is render as app's self UI, such as topbar.
    if (!isUrlFromDapp(url)) return;

    const tabbedWin = getTabbedWindowFromWebContents(sender);
    if (!tabbedWin) return;
    if (tabbedWin !== mainTabbedWin) return;

    evt.preventDefault();
    attachAlertBrowserView(url);
  });

  webContents.setWindowOpenHandler((details) => {
    const currentUrl = webContents.getURL();
    const isFromDapp = isUrlFromDapp(currentUrl);
    const dapps = formatDapps(dappStore.get('dapps'));

    const currentInfo = parseDappUrl(currentUrl, dapps);
    const targetInfo = parseDappUrl(details.url, dapps);
    const sameOrigin = currentInfo.origin === targetInfo.origin;

    if (isFromDapp && !sameOrigin) {
      attachAlertBrowserView(
        details.url,
        targetInfo.existedOrigin,
        getTabbedWindowFromWebContents(webContents)?.window
      );
    } else {
      const isFromExt = currentUrl.startsWith('chrome-extension://');
      const isToExt = details.url.startsWith('chrome-extension://');

      switch (details.disposition) {
        case 'foreground-tab':
        case 'background-tab':
        case 'new-window': {
          const tabbedWin = getTabbedWindowFromWebContents(webContents);

          const openedDapp = !isToExt
            ? tabbedWin?.tabs.findByOrigin(details.url)
            : tabbedWin?.tabs.findByUrlbase(details.url);
          if (openedDapp) {
            switchToBrowserTab(openedDapp!.id, tabbedWin!);
          } else if (mainTabbedWin === tabbedWin) {
            const mainWindow = tabbedWin.window;

            if (isFromExt) {
              const tab = tabbedWin!.createTab();
              tab?.loadURL(details.url);
              if (isRabbyExtBackgroundPage(details.url, rabbyExtId)) {
                tab?.webContents!.openDevTools({
                  mode: 'bottom',
                  activate: true,
                });
              }
              break;
            }

            const continualOpenedTab = tabbedWin.createTab();
            continualOpenedTab?.loadURL(details.url);

            const closeOpenedTab = () => {
              continualOpenedTab?.destroy();
            };

            openDappSecurityCheckView(details.url, mainWindow).then(
              ({ continualOpId }) => {
                // TODO: use timeout mechanism to avoid memory leak
                const dispose = onIpcMainEvent(
                  '__internal_rpc:security-check:continue-close-dapp',
                  (_evt, _openId) => {
                    if (mainWindow && _openId === continualOpId) {
                      dispose?.();
                      closeOpenedTab();
                    }
                  }
                );
              }
            );
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
    };
  });

  webContents.on('context-menu', async (_, params) => {
    const pageURL = params.pageURL || '';
    // it's shell
    if (isRabbyShellURL(pageURL) && IS_RUNTIME_PRODUCTION) return;

    const menu = buildChromeContextMenu({
      params,
      webContents,
      extensionMenuItems: (
        await getElectronChromeExtensions()
      ).getContextMenuItems(webContents, params),
      openLink: (winURL, disposition) => {
        const win = getFocusedWindow();

        switch (disposition) {
          case 'new-window':
            createWindow({ defaultTabUrl: winURL });
            break;
          default: {
            const tab = win.createTab();
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

onIpcMainEvent('__internal_rpc:main-window:click-close', async (evt) => {
  const { sender } = evt;
  const tabbedWin = getTabbedWindowFromWebContents(sender);
  if (tabbedWin === (await onMainWindowReady())) {
    if (isDarwin) {
      tabbedWin.window.hide();
    } else {
      app.quit();
    }
    return;
  }

  tabbedWin?.destroy();
});

export default function bootstrap() {
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

    valueToMainSubject('userAppReady', undefined);

    appLog('::init', 'app ready, paths:');
    appLog('::init', `desktop's home: ${app.getPath('home')}`);
    appLog('::init', `desktop's appData: ${app.getPath('appData')}`);
    appLog('::init', `desktop's userData: ${app.getPath('userData')}`);

    // wait main subject ready
    await defaultSessionReadyThen();

    const lastMainWinPos = getOrInitMainWinPosition();
    // init window
    const mainWindow = await createWindow({
      // defaultTabUrl: RABBY_HOMEPAGE_URL,
      defaultTabUrl: '',
      window: {
        show: false,
        width: lastMainWinPos.width,
        height: lastMainWinPos.height,
        x: lastMainWinPos.x,
        y: lastMainWinPos.y,
      },
      isMainWindow: true,
    });

    const mainWin = mainWindow.window;
    mainWin.on('ready-to-show', () => {
      const bounds = mainWin.getBounds();
      if (
        bounds.x !== lastMainWinPos.x ||
        bounds.y !== lastMainWinPos.y ||
        bounds.width !== lastMainWinPos.width ||
        bounds.height !== lastMainWinPos.height
      ) {
        getOrInitMainWinPosition(mainWin);
      }
    });
    mainWin.on('moved', () => {
      storeMainWinPosition(mainWin);
    });

    mainWin.on('resized', () => {
      storeMainWinPosition(mainWin);
    });

    mainWin.on('close', () => {
      storeMainWinPosition(mainWin);
    });

    const showMainWin = async () => {
      await getRabbyExtViews();
      mainWindow.window.show();
      mainWindow.window.moveTop();
    };

    {
      getWebuiExtId().then((id) => {
        setupMenu({
          getFocusedWebContents: () => {
            return getFocusedWindow().getFocusedTab()?.webContents;
          },
          topbarExtId: id,
        });
      });

      if (isDarwin) {
        app.dock.setIcon(getAssetPath('icon.png'));
      }

      const appTray = new Tray(getTrayIconByTheme());
      // do quit on context menu
      appTray.addListener('click', () => {
        showMainWin();
      });
      app.on('activate', (_, hasVisibleWindows) => {
        if (!hasVisibleWindows) showMainWin();
      });
    }

    const splashWin = new BrowserWindow(
      getBrowserWindowOpts(
        {
          width: 500,
          height: 300,
          minHeight: undefined,
          minWidth: undefined,
          resizable: false,
          transparent: true,
          frame: false,
          alwaysOnTop: true,
        },
        { zeroMinSize: true }
      )
    );
    splashWin.webContents.loadURL(RABBY_SPALSH_URL);

    let gettingStartedWin: BrowserWindow | null = null;

    onIpcMainEvent('redirect-mainWindow', () => {
      if (!gettingStartedWin) return;

      gettingStartedWin.destroy();
      showMainWin();
      gettingStartedWin = null;
    });

    // do this work on mainWin.window postMessage('homePageLoaded') until timeout
    setTimeout(() => {
      splashWin.destroy();

      if (false && desktopAppStore.get('firstStartApp')) {
        gettingStartedWin = new BrowserWindow({
          ...getBrowserWindowOpts(),
          transparent: true,
          frame: false,
          resizable: false,
        });
        gettingStartedWin!.webContents.loadURL(RABBY_GETTING_STARTED_URL);
      } else {
        showMainWin();
      }
    }, 500);
  });
}
