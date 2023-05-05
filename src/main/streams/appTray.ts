import { app, Menu, Tray } from 'electron';
import { APP_BRANDNAME } from '@/isomorphic/constants';
import { getAssetPath } from '../utils/app';
import { appendMenu, appendMenuSeparator } from '../utils/context-menu';
import { emitIpcMainEvent } from '../utils/ipcMainEvents';

const isDarwin = process.platform === 'darwin';
const getTrayIconByTheme = () => {
  if (!isDarwin) return getAssetPath('app-icons/win32-tray-logo.png');

  return getAssetPath('app-icons/macosIconTemplate@2x.png');
};

function buildPopUpContextMenu() {
  const menu = new Menu();

  if (isDarwin) {
    appendMenu(menu, {
      label: 'Show',
      click: async () => {
        emitIpcMainEvent('__internal_main:mainwindow:show');
      },
    });
    appendMenuSeparator(menu);
  }

  appendMenu(menu, {
    label: 'Exit',
    click: async () => {
      app.quit();
    },
  });

  return menu;
}

export function setupAppTray() {
  const appTray = new Tray(getTrayIconByTheme());

  if (!isDarwin) {
    appTray.addListener('click', () => {
      emitIpcMainEvent('__internal_main:mainwindow:show');
    });

    appTray.addListener('right-click', () => {
      appTray.popUpContextMenu(buildPopUpContextMenu());
    });
  } else {
    appTray.setToolTip(APP_BRANDNAME);
    appTray.addListener('click', () => {
      appTray.popUpContextMenu(buildPopUpContextMenu());
    });
  }

  return appTray;
}
