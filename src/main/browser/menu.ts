import { Menu, shell } from 'electron';
import { IS_RUNTIME_PRODUCTION } from '../../isomorphic/constants';
import { emitIpcMainEvent } from '../utils/ipcMainEvents';

export const setupMenu = ({
  getFocusedWebContents,
  topbarExtId,
}: {
  getFocusedWebContents: () => Electron.WebContents | void;
  topbarExtId: string;
}) => {
  const isMac = process.platform === 'darwin';

  const ViewMenus: Electron.MenuItemConstructorOptions = {
    label: 'View',
    submenu: <
      Electron.MenuItemConstructorOptions['submenu'] &
        Electron.MenuItemConstructorOptions
    >[
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        nonNativeMacOSRole: true,
        click: () => getFocusedWebContents()?.reload(),
      },
      {
        label: 'Force Reload',
        accelerator: 'Shift+CmdOrCtrl+R',
        nonNativeMacOSRole: true,
        click: () => getFocusedWebContents()?.reloadIgnoringCache(),
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
      !IS_RUNTIME_PRODUCTION
        ? {
            label: 'Toggle Developer Tool',
            accelerator: isMac ? 'Alt+Command+I' : 'Ctrl+Shift+I',
            nonNativeMacOSRole: true,
            click: () => {
              const win = getFocusedWebContents();
              if (!win) return;
              if (
                !win.isDevToolsOpened() &&
                win.getURL().includes(`chrome-extension://${topbarExtId}`)
              ) {
                win.openDevTools({ mode: 'detach' });
              } else {
                win.toggleDevTools();
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
      { type: 'separator' },
      { role: 'quit' },
    ].filter(Boolean),
  };

  const template: Electron.MenuItemConstructorOptions[] = [
    // ...(isMac ? [{ role: 'appMenu' }] : []),
    // { role: 'fileMenu' },
    // { role: 'editMenu' },
    ViewMenus,
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
};
