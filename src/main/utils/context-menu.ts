import { Menu, MenuItem } from 'electron';

export const appendMenu = (
  targetMenu: Menu,
  newOpts: Electron.MenuItemConstructorOptions | MenuItem
) => {
  return targetMenu.append(
    newOpts instanceof MenuItem ? newOpts : new MenuItem(newOpts)
  );
};
export const appendMenuSeparator = (targetMenu: Menu) => {
  return targetMenu.append(new MenuItem({ type: 'separator' }));
};
