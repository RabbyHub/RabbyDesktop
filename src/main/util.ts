/* eslint import/prefer-default-export: off */
import path from 'path';
// import url from 'url';
import { app } from 'electron';

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
