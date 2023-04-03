import { app, BrowserWindow, dialog, shell } from 'electron';

import {
  APP_NAME,
  IS_RUNTIME_PRODUCTION,
  RABBY_SPALSH_URL,
} from '../../isomorphic/constants';
import { isRabbyShellURL, isUrlFromDapp } from '../../isomorphic/url';
import buildChromeContextMenu from '../browser/context-menu';
import { setupMenu } from '../browser/menu';
import { storeMainWinPosition } from '../store/desktopApp';
import {
  getAssetPath,
  getBrowserWindowOpts,
  getMainProcessAppChannel,
  relaunchApp,
  initMainProcessSentry,
} from '../utils/app';
import {
  emitIpcMainEvent,
  handleIpcMainInvoke,
  onIpcMainEvent,
  onIpcMainInternalEvent,
} from '../utils/ipcMainEvents';
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
  getRabbyExtViews,
} from '../utils/stream-helpers';
import { notifySwitchedToBrowserTab } from '../utils/browser';
import { getAppUserDataPath } from '../utils/store';
import { getMainWinLastPosition } from '../utils/screen';
import { clearAllStoreData, clearAllUserData } from '../utils/security';
import { tryAutoUnlockRabbyX } from './rabbyIpcQuery/autoUnlock';
import { alertAutoUnlockFailed } from './mainWindow';
import { setupAppTray } from './appTray';
import { checkForceUpdate } from '../updater/force_update';
import { getOrCreateDappBoundTab } from '../utils/tabbedBrowserWindow';
import { MainTabbedBrowserWindow } from '../browser/browsers';

const appLog = getBindLog('appStream', 'bgGrey');

const isDarwin = process.platform === 'darwin';

const DENY_ACTION = { action: 'deny' } as const;

// const appProxyConf = getAppProxyConf();
// if (appProxyConf.proxyType === 'custom' && appProxyConf.proxySettings) {
//   const proxyServer = formatProxyServerURL(appProxyConf.proxySettings);
//   app.commandLine.appendSwitch('--proxy-server', proxyServer);
//   appLog(`set proxy server: ${proxyServer}`);
// }

app.on('web-contents-created', async (evtApp, webContents) => {
  const type = webContents.getType();
  const wcUrl = webContents.getURL();
  appLog(
    `'web-contents-created' webContents [id:${webContents.id}, type:${type}, url:${wcUrl}]`
  );

  const mainTabbedWin = await onMainWindowReady();

  if (!isTabbedWebContents(webContents)) {
    webContents.setWindowOpenHandler((details) => {
      const currentURL = webContents.getURL();

      // actually, it's always false
      const isFromDapp = isUrlFromDapp(currentURL);
      if (isFromDapp) return { ...DENY_ACTION };

      const isFromExt = currentURL.startsWith('chrome-extension://');
      const isToExt = details.url.startsWith('chrome-extension://');

      switch (details.disposition) {
        case 'foreground-tab':
        case 'background-tab':
        case 'new-window': {
          const tabbedWin = getTabbedWindowFromWebContents(webContents);

          const dappTab =
            tabbedWin && findOpenedDappTab(tabbedWin, details.url, isToExt);
          if (dappTab) {
            notifySwitchedToBrowserTab(dappTab!.id, tabbedWin!);
          } else if (mainTabbedWin === tabbedWin) {
            if (!isFromExt) {
              const { finalTab: continualOpenedTab } = getOrCreateDappBoundTab(
                mainTabbedWin,
                details.url
              );
              continualOpenedTab?.loadURL(details.url);
            } else {
              const tab = mainTabbedWin.createTab({
                initDetails: details,
              });
              tab?.loadURL(details.url);
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

    const menu = await buildChromeContextMenu({
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

app.on('activate', (_, hasVisibleWindows) => {
  if (!hasVisibleWindows) emitIpcMainEvent('__internal_main:mainwindow:show');
});

onIpcMainEvent('__internal_rpc:main-window:click-close', async (evt) => {
  const { sender } = evt;
  const tabbedWin = getTabbedWindowFromWebContents(sender);
  const mainTabbedWin = await onMainWindowReady();
  if (tabbedWin === mainTabbedWin) {
    app.quit();
    return;
  }

  tabbedWin?.destroy();
});

handleIpcMainInvoke('get-app-version', (_) => {
  return {
    version: app.getVersion(),
    appChannel: getMainProcessAppChannel(),
  };
});

handleIpcMainInvoke('get-os-info', () => {
  return {
    platform: process.platform,
    arch: process.arch,
  };
});

onIpcMainEvent(
  '__internal_rpc:app:open-external-url',
  async (evt, externalURL) => {
    const currentURL = evt.sender.getURL();
    const isFromDapp = isUrlFromDapp(currentURL);
    if (isFromDapp) return;

    shell.openExternal(externalURL);
  }
);

const ResetDialogButtons = ['Cancel', 'Confirm'] as const;
onIpcMainInternalEvent('__internal_main:app:reset-app', async () => {
  const cancleId = ResetDialogButtons.findIndex((x) => x === 'Cancel');
  const confirmId = ResetDialogButtons.findIndex((x) => x === 'Confirm');

  const mainWin = await onMainWindowReady();
  const result = await dialog.showMessageBox(mainWin.window, {
    type: 'question',
    title: 'Reset Rabby',
    message:
      'All data about Rabby Desktop would be clear. Do you confirm to reset Rabby?',
    defaultId: cancleId,
    cancelId: cancleId,
    noLink: true,
    buttons: ResetDialogButtons as any as string[],
  });

  appLog('reset app response:', result.response);
  if (result.response === confirmId) {
    clearAllStoreData();
    clearAllUserData(mainWin.window.webContents.session);

    try {
      const { backgroundWebContents } = await getRabbyExtViews();
      await backgroundWebContents.executeJavaScript(
        `chrome.storage.local.clear();`
      );
    } catch (e: any) {
      dialog.showErrorBox('Error', `Failed to clear Rabby extension data.`);
    }

    await dialog.showMessageBox(mainWin.window, {
      title: 'Reset Rabby',
      type: 'info',
      message: !IS_RUNTIME_PRODUCTION
        ? 'Rabby has been reset. save entry file to restart program.'
        : 'Rabby has been reset. click OK to relaunch Rabby.',
    });

    emitIpcMainEvent('__internal_main:app:relaunch');
  }
});
onIpcMainEvent('__internal_rpc:app:reset-app', () => {
  emitIpcMainEvent('__internal_main:app:reset-app');
});
onIpcMainInternalEvent('__internal_main:app:relaunch', () => {
  if (IS_RUNTIME_PRODUCTION) {
    relaunchApp();
  } else {
    app.exit(0);
  }
});

export default function bootstrap() {
  app.setPath('userData', getAppUserDataPath());
  if (!IS_RUNTIME_PRODUCTION) {
    // we just need to modify it for development, because `APP_NAME` in production is from package.json
    app.setName(APP_NAME);
  }
  initMainProcessSentry();

  // eslint-disable-next-line promise/catch-or-return
  app.whenReady().then(async () => {
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
     * -> rabbyExtensionLoaded
     * -> electronChromeExtensionsReady
     *
     * so we just need to wait electronChromeExtensionsReady ready
     */
    const shellExts = await getElectronChromeExtensions();

    const lastMainWinPos = getMainWinLastPosition();
    // init window
    const mainWindow = (await createWindow({
      defaultTabUrl: '',
      window: {
        show: false,
        width: lastMainWinPos.width,
        height: lastMainWinPos.height,
        x: lastMainWinPos.x,
        y: lastMainWinPos.y,
        webPreferences: {
          webviewTag: true,
        },
      },
      webuiType: 'MainWindow',
    })) as MainTabbedBrowserWindow;

    const mainWin = mainWindow.window;
    mainWin.on('ready-to-show', () => {
      checkForceUpdate();
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

    setupAppTray();

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

    await getRabbyExtViews();
    const { useBuiltInPwd } = await tryAutoUnlockRabbyX();
    appLog(`autoUnlock ${useBuiltInPwd ? 'success' : 'failed'}`);

    splashWin.destroy();
    setTimeout(() => {
      emitIpcMainEvent('__internal_main:mainwindow:show', true);
    }, 200);

    if (!useBuiltInPwd) {
      alertAutoUnlockFailed();
    }
    // repairDappsFieldsOnBootstrap();
  });
}
