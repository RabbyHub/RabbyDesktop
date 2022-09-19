/* eslint import/prefer-default-export: off */
import path from 'path';
// import url from 'url';
import { app } from 'electron';

export function getMainPlatform () {
  return process.platform as 'win32' | 'darwin'
}

function resolveReleasePath(file: string) {
  if (process.env.NODE_ENV === 'development') {
    return path.resolve(path.join(__dirname, '../../release/app/dist'), file);
  }

  return `file://${path.resolve(__dirname, '../', file)}`;
}

export function getMainPath(file: string) {
  if (process.env.NODE_ENV === 'development') {
    return path.resolve(
      path.join(__dirname, '../../release/app/dist/main'),
      file
    );
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
  : path.join(__dirname, '../../assets');

export const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};

export const preloadPath = app.isPackaged
  ? path.join(__dirname, 'preload.js')
  : path.join(__dirname, '../../.erb/dll/preload.js');

export function getShellPageUrl (type: 'webui' | 'debug-new-tab', webuiExtensionId: string) {
    switch (type) {
      case 'debug-new-tab':
      default:
        return `chrome-extension://${webuiExtensionId}/shell-new-tab.html`;
      case 'webui':
        return `chrome-extension://${webuiExtensionId}/shell-webui.html`;
    }
}

export function getWindowIconOpts (): {
  icon: Electron.BrowserWindowConstructorOptions['icon']
} {
  return {
    icon: getMainPlatform() === 'darwin' ? getAssetPath('icons/256x256.png') : getAssetPath('icon.ico'),
  }
}
