/* eslint import/prefer-default-export: off */
import path from 'path';
import child_process from 'child_process';
import { app, crashReporter, net } from 'electron';
import logger from 'electron-log';

import * as Sentry from '@sentry/electron/main';

import { filterAppChannel, getSentryEnv } from '@/isomorphic/env';
import {
  FRAME_DEFAULT_SIZE,
  FRAME_MIN_SIZE,
} from '../../isomorphic/const-size';
import {
  APP_NAME,
  IS_DEVTOOLS_AVAILBLE,
  IS_RUNTIME_PRODUCTION,
  SENTRY_DEBUG,
} from '../../isomorphic/constants';
import { getWindowBoundsInWorkArea } from './screen';
import {
  desktopAppStore,
  getFullAppProxyConf,
  getMainWindowDappViewZoomPercent,
} from '../store/desktopApp';

const PROJ_ROOT = path.join(__dirname, '../../../');

export function getMainPlatform() {
  return process.platform as 'win32' | 'darwin';
}

export function getMainBuildInfo() {
  const buildchannel: 'reg' | 'prod' = (process as any).buildchannel || 'reg';
  return {
    buildchannel,
    buildarch:
      (process as any).buildarch || (process.arch as 'win32' | 'darwin'),
  };
}

function resolveReleasePath(file: string) {
  if (process.env.NODE_ENV === 'development') {
    return path.resolve(path.join(PROJ_ROOT, './release/app/dist'), file);
  }

  return `file://${path.resolve(__dirname, '../', file)}`;
}

export function getMainPath(file: string) {
  if (process.env.NODE_ENV === 'development') {
    return path.join(PROJ_ROOT, './release/app/dist/main', file);
  }

  return path.join(__dirname, file);
}

export function getRendererPath(file: string) {
  // trim search(query, hash, etc)
  // const { pathname } = url.parse(file);
  // return getMainPath(`../renderer/${pathname}`);
  return getMainPath(`../renderer/${file}`);
}

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(PROJ_ROOT, './assets');

export const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};

export const preloadPath = app.isPackaged
  ? path.join(__dirname, 'preload.js')
  : path.join(PROJ_ROOT, './.erb/dll/preload.js');

export function getShellPageUrl(
  type: 'webui' | 'debug-new-tab',
  webuiExtensionId: string
) {
  switch (type) {
    case 'debug-new-tab':
    default:
      return `chrome-extension://${webuiExtensionId}/new-tab.html`;
    case 'webui':
      return `chrome-extension://${webuiExtensionId}/webui.html`;
  }
}

function getWindowIconOpts(): {
  icon: Electron.BrowserWindowConstructorOptions['icon'];
} {
  return {
    icon:
      getMainPlatform() === 'darwin'
        ? getAssetPath('icons/256x256.png')
        : getAssetPath('icon.ico'),
  };
}

export function getBrowserWindowOpts(
  windowOpts?: Electron.BrowserWindowConstructorOptions,
  opts?: { zeroMinSize?: boolean }
): Electron.BrowserWindowConstructorOptions {
  const isPopup = windowOpts?.type === 'popup';

  const expectedBounds = getWindowBoundsInWorkArea({
    x: windowOpts?.x,
    y: windowOpts?.y,
    width: windowOpts?.width || FRAME_MIN_SIZE.minWidth,
    height: windowOpts?.height || FRAME_MIN_SIZE.minHeight,
  });

  if (!IS_RUNTIME_PRODUCTION) {
    console.debug('[getBrowserWindowOpts] expectedBounds', expectedBounds);
  }

  return {
    ...FRAME_DEFAULT_SIZE,
    // ...FRAME_MAX_SIZE,
    ...(!isPopup && !opts?.zeroMinSize ? FRAME_MIN_SIZE : {}),
    width: expectedBounds.width,
    height: expectedBounds.height,
    frame: false,
    icon: getWindowIconOpts().icon,
    resizable: true,
    fullscreenable: true,
    ...windowOpts,
    webPreferences: {
      webviewTag: true,
      // sandbox: true,
      sandbox: false,
      nodeIntegration: false,
      // enableRemoteModule: false,
      contextIsolation: true,
      // worldSafeExecuteJavaScript: true,
      devTools: IS_DEVTOOLS_AVAILBLE,
      ...windowOpts?.webPreferences,
    },
  };
}

export function getMainProcessAppChannel() {
  return filterAppChannel((process as any).buildchannel);
}

let sentryInited = false;
/**
 * @warning make sure calling after app's userData setup
 */
export function initMainProcessSentry() {
  process.on('unhandledRejection', (error) => {
    logger.info(error);
    Sentry.captureException(error);
  });
  process.on('uncaughtException', (err) => {
    logger.error(err);
    Sentry.captureException(err);
  });

  Sentry.init({
    dsn: !IS_RUNTIME_PRODUCTION
      ? ''
      : 'https://520afbe8f6574cb3a39e6cb7296f9008@o460488.ingest.sentry.io/4504751161868288',
    release: app.getVersion(),

    // enableNative: false,

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
    environment: getSentryEnv(getMainProcessAppChannel()),
    debug: SENTRY_DEBUG,
    transportOptions: {
      // The maximum number of days to keep an event in the queue.
      maxQueueAgeDays: 30,
      // The maximum number of events to keep in the queue.
      maxQueueCount: 30,
      // Called every time the number of requests in the queue changes.
      queuedLengthChanged: (length) => {},
      // Called before attempting to send an event to Sentry. Used to override queuing behavior.
      //
      // Return 'send' to attempt to send the event.
      // Return 'queue' to queue and persist the event for sending later.
      // Return 'drop' to drop the event.
      beforeSend: (request) => (net.isOnline() ? 'send' : 'queue'),
    },
  });

  const crashDumps = path.join(app.getPath('userData'), 'app_crash_dumps');
  app.setPath('crashDumps', crashDumps);

  crashReporter.start({
    productName: APP_NAME,
    // ignoreSystemCrashHandler: true,
    submitURL:
      'https://o460488.ingest.sentry.io/api/4504751161868288/minidump/?sentry_key=520afbe8f6574cb3a39e6cb7296f9008',
  });

  sentryInited = true;
}

export const IS_REG_BUILD = (process as any).buildchannel === 'reg';
export const IS_APP_PROD_BUILD = (process as any).buildchannel === 'prod';

export function relaunchApp() {
  const relaunchOptions = {
    execPath: process.execPath,
    args: process.argv,
  };
  // /**
  //  * Fix for AppImage on Linux.
  //  */
  // if (process.env.APPIMAGE) {
  //   relaunchOptions.execPath = process.env.APPIMAGE;
  //   relaunchOptions.args.unshift('--appimage-extract-and-run');
  // }
  app.relaunch(relaunchOptions);
  app.exit();
}

export function getAppProjRefName() {
  if (IS_RUNTIME_PRODUCTION) {
    return (process as any).GIT_COMMITHASH.slice(0, 7);
  }
  // git log --format="%h" -n 1
  return child_process.execSync('git log --format="%h" -n 1').toString().trim();
}

export async function logsOnAppBootstrap() {
  if (!sentryInited) {
    console.error('sentry not inited');
    return;
  }

  Sentry.captureEvent({
    message: 'UserSetting',
    level: 'info',
    tags: {
      reportTime: 'bootstrap',
      dappRatio: getMainWindowDappViewZoomPercent(),
      sidebarCollapsed: desktopAppStore.get('sidebarCollapsed'),
      proxyType: (await getFullAppProxyConf()).proxyType,
    },
  });
}
