/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import path from 'path';
import { app, BrowserView } from 'electron';

export function resolveHtmlPath(htmlFileName: string) {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 1212;
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  }
  return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
}

const RESOURCES_PATH = app.isPackaged
? path.join(process.resourcesPath, 'assets')
: path.join(__dirname, '../../assets');

export const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};

export async function addBrowserView (
  browser: Electron.BrowserWindow,
  webPreferences?: Electron.WebPreferences
) {
  const view = new BrowserView({
    webPreferences: webPreferences
  })
  browser.addBrowserView(view)

  await view.webContents.loadURL('https://baidu.com')
  view.webContents.openDevTools({ mode: 'detach' });
}
