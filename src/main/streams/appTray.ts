import { app, Menu, Tray } from 'electron';
import { APP_BRANDNAME } from '@/isomorphic/constants';
import { getAssetPath } from '../utils/app';
import { appendMenu, appendMenuSeparator } from '../utils/context-menu';
import { emitIpcMainEvent } from '../utils/ipcMainEvents';
import { onMainWindowReady } from '../utils/stream-helpers';

const isDarwin = process.platform === 'darwin';
const getTrayIconByTheme = () => {
  if (!isDarwin) return getAssetPath('app-icons/win32-tray-logo.png');

  return getAssetPath('app-icons/macosIconTemplate@2x.png');
};

async function buildPopUpContextMenu() {
  const menu = new Menu();

  appendMenu(menu, {
    label: 'Show',
    click: async () => {
      emitIpcMainEvent('__internal_main:mainwindow:show');
    },
  });
  appendMenuSeparator(menu);

  let mainWinShown = false;
  try {
    const mainTabbedWin = await onMainWindowReady();
    mainWinShown = mainTabbedWin.window?.isVisible();
  } catch (error) {
    console.error(error);
  } finally {
    if (mainWinShown) {
      appendMenu(menu, {
        label: 'Center Window',
        click: async () => {
          emitIpcMainEvent('__internal_main:mainwindow:show');
          emitIpcMainEvent('__internal_main:mainwindow:center-window');
        },
      });
    }
  }

  appendMenuSeparator(menu);

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
    appTray.setToolTip(APP_BRANDNAME);
    appTray.addListener('click', () => {
      emitIpcMainEvent('__internal_main:mainwindow:show');
    });

    appTray.addListener('right-click', async () => {
      appTray.popUpContextMenu(await buildPopUpContextMenu());
    });
  } else {
    appTray.addListener('click', async () => {
      appTray.popUpContextMenu(await buildPopUpContextMenu());
    });
  }

  return appTray;
}
