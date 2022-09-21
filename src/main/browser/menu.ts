import { Menu } from 'electron';
import { IS_RUNTIME_PRODUCTION } from '../../isomorphic/constants';

export const setupMenu = ({
  getFocusedWebContents,
  topbarExtId
} : {
  getFocusedWebContents: () => Electron.WebContents | void,
  topbarExtId: string,
}) => {
  const isMac = process.platform === 'darwin';

  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    { role: 'fileMenu' },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
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
        !IS_RUNTIME_PRODUCTION ? {
          label: 'Toggle Developer Tool',
          accelerator: isMac ? 'Alt+Command+I' : 'Ctrl+Shift+I',
          nonNativeMacOSRole: true,
          click: () => {
            const win = getFocusedWebContents();
            if (!win) return ;
            if (!win.isDevToolsOpened() && win.getURL().includes(`chrome-extension://${topbarExtId}`)) {
              win.openDevTools({ mode: 'detach' });
            } else {
              win.toggleDevTools()
            }
          },
        } : null,
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ].filter(Boolean),
    },
    { role: 'windowMenu' },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};
