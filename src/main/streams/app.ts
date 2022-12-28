import { app, BrowserWindow, Tray } from 'electron';

import {
  APP_NAME,
  IS_RUNTIME_PRODUCTION,
  RABBY_SPALSH_URL,
} from '../../isomorphic/constants';
import {
  isRabbyXPage,
  isRabbyShellURL,
  isUrlFromDapp,
} from '../../isomorphic/url';
import buildChromeContextMenu from '../browser/context-menu';
import { setupMenu } from '../browser/menu';
import {
  getOrInitMainWinPosition,
  storeMainWinPosition,
} from '../store/desktopApp';
import { getAssetPath, getBrowserWindowOpts } from '../utils/app';
import { onIpcMainEvent } from '../utils/ipcMainEvents';
import { getBindLog } from '../utils/log';
import {
  createWindow,
  findOpenedDappTab,
  getFocusedWindow,
  getTabbedWindowFromWebContents,
  isTabbedWebContents,
} from './tabbedBrowserWindow';
import { valueToMainSubject } from './_init';
import {
  getElectronChromeExtensions,
  getWebuiExtId,
  onMainWindowReady,
  getRabbyExtId,
  getRabbyExtViews,
} from '../utils/stream-helpers';
import { switchToBrowserTab } from '../utils/browser';
import { createDappTab } from './webContents';

const appLog = getBindLog('appStream', 'bgGrey');

const isDarwin = process.platform === 'darwin';
const getTrayIconByTheme = () => {
  if (!isDarwin) return getAssetPath('app-icons/win32-tray-logo.png');

  return getAssetPath('app-icons/macosIconTemplate@2x.png');
};

const DENY_ACTION = { action: 'deny' } as const;

app.on('web-contents-created', async (evtApp, webContents) => {
  const type = webContents.getType();
  const wcUrl = webContents.getURL();
  appLog(`'web-contents-created' event [type:${type}, url:${wcUrl}]`);

  const mainTabbedWin = await onMainWindowReady();
  const rabbyExtId = await getRabbyExtId();

  if (!isTabbedWebContents(webContents)) {
    webContents.setWindowOpenHandler((details) => {
      const currentUrl = webContents.getURL();

      // actually, it's always false
      const isFromDapp = isUrlFromDapp(currentUrl);
      if (isFromDapp) return { ...DENY_ACTION };

      const isFromExt = currentUrl.startsWith('chrome-extension://');
      const isToExt = details.url.startsWith('chrome-extension://');

      switch (details.disposition) {
        case 'foreground-tab':
        case 'background-tab':
        case 'new-window': {
          const tabbedWin = getTabbedWindowFromWebContents(webContents);

          const dappTab =
            tabbedWin && findOpenedDappTab(tabbedWin, details.url, isToExt);
          if (dappTab) {
            switchToBrowserTab(dappTab!.id, tabbedWin!);
          } else if (mainTabbedWin === tabbedWin) {
            if (!isFromExt) {
              createDappTab(tabbedWin, details.url);
            } else {
              const tab = mainTabbedWin.createTab({
                initDetails: details,
              });
              tab?.loadURL(details.url);
              if (isRabbyXPage(details.url, rabbyExtId, 'background')) {
                tab?.view?.webContents!.openDevTools({
                  mode: 'bottom',
                  activate: true,
                });
              }
            }
          }
          break;
        }
        default: {
          break;
        }
      }

      return { ...DENY_ACTION };
    });
  }

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
    /**
     * orders:
     * sessionReady
     * -> webuiExtensionReady
     * -> rabbyExtensionReady
     * -> electronChromeExtensionsReady
     *
     * so we just need to wait electronChromeExtensionsReady ready
     */
    const shellExts = await getElectronChromeExtensions();

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

    shellExts.addWindow(mainWin);
    valueToMainSubject('mainWindowReady', mainWindow);

    const showMainWin = async () => {
      await getRabbyExtViews();
      mainWindow.window.show();
      mainWindow.window.moveTop();
    };

    {
      getWebuiExtId().then((id) => {
        setupMenu({
          getFocusedWebContents: () => {
            return getFocusedWindow().getFocusedTab()?.view?.webContents;
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

    // do this work on mainWin.window postMessage('homePageLoaded') until timeout
    setTimeout(() => {
      splashWin.destroy();
      showMainWin();
    }, 500);
  });
}
