/* eslint import/prefer-default-export: off */
import path from 'path';
import { app } from 'electron';

function resolveReleasePath(file: string) {
  if (process.env.NODE_ENV === 'development') {
    return path.resolve(path.join(__dirname, '../../release/app/dist'), file);
  }

  return `file://${path.resolve(__dirname, '../', file)}`;
}

export function resolveMainPath (file: string) {
  return path.join(__dirname, file);
}

export function resolveRendererPath(file: string) {
  if (process.env.NODE_ENV === 'development') {
    return resolveReleasePath(path.join('renderer', file));
  }
  return `file://${path.resolve(__dirname, '../renderer/', file)}`;
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
