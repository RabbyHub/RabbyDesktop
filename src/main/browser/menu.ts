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

  const template = [
    // ...(isMac ? [{ role: 'appMenu' }] : []),
    // { role: 'fileMenu' },
    // { role: 'editMenu' },
    {
      label: 'View',
      submenu: <Electron.MenuItemConstructorOptions['submenu']>[
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
    },
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
