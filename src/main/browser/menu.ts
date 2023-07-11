import { Menu, shell } from 'electron';
import {
  APP_BRANDNAME,
  IS_DEVTOOLS_AVAILBLE,
} from '../../isomorphic/constants';
import { emitIpcMainEvent } from '../utils/ipcMainEvents';
import { getFocusedWindow } from '../utils/tabbedBrowserWindow';
import { getRabbyExtId, onMainWindowReady } from '../utils/stream-helpers';

const isDarwin = process.platform === 'darwin';
function getFocusedTab() {
  return getFocusedWindow().getFocusedTab();
}

export async function setupAppMenu() {
  const mainTabbedWin = await onMainWindowReady();
  const currentSelectedTab = mainTabbedWin.tabs.selected;

  const appMenus = !isDarwin
    ? null
    : {
        label: APP_BRANDNAME,
        submenu: [
          // { role: 'about' },
          // { type: 'separator' },
          // { role: 'services' },
          // { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' },
        ],
      };

  const ViewSubMenusAboutDapp: Electron.MenuItemConstructorOptions[] =
    !currentSelectedTab
      ? []
      : [
          {
            label: 'Reload',
            accelerator: 'CmdOrCtrl+R',
            nonNativeMacOSRole: true,
            click: () => getFocusedTab()?.reload(),
          },
          {
            label: 'Force Reload',
            accelerator: 'Shift+CmdOrCtrl+R',
            nonNativeMacOSRole: true,
            click: () =>
              getFocusedTab()?.view?.webContents?.reloadIgnoringCache(),
          },
          {
            label: 'Find In Dapp',
            accelerator: 'CmdOrCtrl+F',
            nonNativeMacOSRole: true,
            click: () => {
              emitIpcMainEvent('__internal_main:mainwindow:op-find-in-page', {
                type: 'start-find',
              });
            },
          },
          ...['CmdOrCtrl+G', 'F3'].map((accelerator, idx) => {
            return {
              label: 'Find Forward In Dapp',
              accelerator,
              nonNativeMacOSRole: true,
              visible: idx === 0,
              click: () => {
                emitIpcMainEvent('__internal_main:mainwindow:op-find-in-page', {
                  type: 'find-forward',
                });
              },
            };
          }),
          ...['Shift+CmdOrCtrl+G', 'F2'].map((accelerator, idx) => {
            return {
              label: 'Find Backward In Dapp',
              accelerator,
              nonNativeMacOSRole: true,
              visible: idx === 0,
              click: () => {
                emitIpcMainEvent('__internal_main:mainwindow:op-find-in-page', {
                  type: 'find-backward',
                });
              },
            };
          }),
          // ...['CmdOrCtrl+H'].map((accelerator, idx) => {
          //   return {
          //     click: () => { /** close dapp tab  */ },
          //     accelerator,
          //     nonNativeMacOSRole: true,
          //     visible: idx === 0,
          //   }
          // }),
        ];

  const ViewMenus: Electron.MenuItemConstructorOptions = {
    label: 'View',
    submenu: <
      Electron.MenuItemConstructorOptions['submenu'] &
        Electron.MenuItemConstructorOptions
    >[
      ...ViewSubMenusAboutDapp,
      IS_DEVTOOLS_AVAILBLE
        ? {
            label: 'Toggle Developer Tool',
            accelerator: isDarwin ? 'Alt+Command+I' : 'Ctrl+Shift+I',
            nonNativeMacOSRole: true,
            click: async () => {
              const topbarExtId = await getRabbyExtId();

              const tab = getFocusedTab();
              let webContents: Electron.WebContents | null | undefined =
                tab?.view?.webContents;
              if (!webContents) {
                webContents = getFocusedWindow()?.window.webContents;
              }

              if (!webContents) return;

              if (
                !webContents.isDevToolsOpened() &&
                webContents
                  .getURL()
                  .includes(`chrome-extension://${topbarExtId}`)
              ) {
                webContents.openDevTools({ mode: 'detach' });
              } else {
                webContents.toggleDevTools();
              }
            },
          }
        : (null as any),
      { type: 'separator' },
      // { role: 'resetZoom' },
      // { role: 'zoomIn' },
      // { role: 'zoomOut' },
      // { type: 'separator' },
      { role: 'copy' },
      { role: 'cut' },
      { role: 'paste' },
      { role: 'delete' },
      { role: 'selectAll' },
      { type: 'separator' },
      { role: 'togglefullscreen' },
    ].filter(Boolean),
  };

  const WindowMenus: Electron.MenuItemConstructorOptions = {
    label: 'Window',
    submenu: <
      Electron.MenuItemConstructorOptions['submenu'] &
        Electron.MenuItemConstructorOptions
    >[
      { role: 'minimize' },
      // { role: 'zoom' },
      ...(isDarwin
        ? [
            { type: 'separator' },
            { role: 'front' },
            { type: 'separator' },
            { role: 'window' },
          ]
        : [{ role: 'close' }]),
    ].filter(Boolean),
  };

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(!appMenus ? [] : ([appMenus] as Electron.MenuItemConstructorOptions[])),
    // { role: 'fileMenu' },
    // { role: 'editMenu' },
    ViewMenus,
    WindowMenus, // { role: 'windowMenu' },
    {
      label: 'Help',
      submenu: <Electron.MenuItemConstructorOptions['submenu']>[
        {
          label: 'Privacy Policy',
          click: async () => {
            shell.openExternal('https://rabby.io/docs/privacy/');
          },
        },
        {
          type: 'separator',
        },
        {
          label: 'Reset App Data',
          accelerator: 'Option',
          click: async () => {
            emitIpcMainEvent('__internal_main:app:reset-app');
          },
        },
      ].filter(Boolean),
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
