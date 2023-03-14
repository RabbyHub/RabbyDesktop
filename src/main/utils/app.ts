/* eslint import/prefer-default-export: off */
import path from 'path';
import { app } from 'electron';
import * as Sentry from '@sentry/electron/main';

import { filterAppChannel, getSentryEnv } from '@/isomorphic/env';
import {
  FRAME_DEFAULT_SIZE,
  FRAME_MIN_SIZE,
} from '../../isomorphic/const-size';
import { IS_RUNTIME_PRODUCTION } from '../../isomorphic/constants';
import { getWindowBoundsInWorkArea } from './screen';

const PROJ_ROOT = path.join(__dirname, '../../../');

export function getMainPlatform() {
  return process.platform as 'win32' | 'darwin';
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
      // sandbox: true,
      sandbox: false,
      nodeIntegration: false,
      // enableRemoteModule: false,
      contextIsolation: true,
      // worldSafeExecuteJavaScript: true,
      devTools: !IS_RUNTIME_PRODUCTION,
      ...windowOpts?.webPreferences,
    },
  };
}

export function getMainProcessAppChannel() {
  return filterAppChannel((process as any).buildchannel);
}

/**
 * @warning make sure calling after app's userData setup
 */
export function initMainProcessSentry() {
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
    debug: !IS_RUNTIME_PRODUCTION,
  });
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
