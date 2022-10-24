/* eslint import/prefer-default-export: off */
import path from 'path';
import { app } from 'electron';
import { FRAME_DEFAULT_SIZE, FRAME_MAX_SIZE, FRAME_MIN_SIZE } from '../../isomorphic/const-size';
import { IS_RUNTIME_PRODUCTION } from '../../isomorphic/constants';

const PROJ_ROOT = path.join(__dirname, '../../../');

export function getMainPlatform () {
  return process.platform as 'win32' | 'darwin'
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

export function getShellPageUrl (type: 'webui' | 'debug-new-tab', webuiExtensionId: string) {
    switch (type) {
      case 'debug-new-tab':
      default:
        return `chrome-extension://${webuiExtensionId}/shell-new-tab.html`;
      case 'webui':
        return `chrome-extension://${webuiExtensionId}/shell-webui.html`;
    }
}

function getWindowIconOpts (): {
  icon: Electron.BrowserWindowConstructorOptions['icon']
} {
  return {
    icon: getMainPlatform() === 'darwin' ? getAssetPath('icons/256x256.png') : getAssetPath('icon.ico'),
  }
}

export function getBrowserWindowOpts(
  windowOpts?: Electron.BrowserWindowConstructorOptions,
  opts?: { zeroMinSize?: boolean }
): Electron.BrowserWindowConstructorOptions {
  const isPopup = windowOpts?.type === 'popup';

  return {
    ...FRAME_DEFAULT_SIZE,
    ...FRAME_MAX_SIZE,
    ...!isPopup && !opts?.zeroMinSize ? FRAME_MIN_SIZE : {},
    width: FRAME_MIN_SIZE.minWidth,
    height: FRAME_MIN_SIZE.minHeight,
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
      ...windowOpts?.webPreferences
    },
  }
}

export const IS_REG_BUILD = (process as any).buildchannel === 'reg';
