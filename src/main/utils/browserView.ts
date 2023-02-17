import {
  NativeAppSizes,
  NativeLayouts,
  NativeLayoutsCollapsed,
} from '@/isomorphic/const-size-next';
import { BrowserView, BrowserViewConstructorOptions } from 'electron';
import { desktopAppStore } from '../store/desktopApp';
import { redirectToAboutBlank } from './browser';

export class BrowserViewManager {
  private idleViews: Record<number, BrowserView> = {};

  private busyViews: Record<number, BrowserView> = {};

  constructor(private viewOpts: BrowserViewConstructorOptions) {}

  allocateView(loadBlank = false) {
    let view = Object.values(this.idleViews)[0];

    if (!view || view.webContents.isDestroyed()) {
      view = new BrowserView({
        ...this.viewOpts,
      });
    }

    delete this.idleViews[view.webContents.id];
    this.busyViews[view.webContents.id] = view;
    if (loadBlank) {
      view.webContents.loadURL('about:blank');
    }

    return view;
  }

  recycleView(view: BrowserView) {
    delete this.busyViews[view.webContents.id];

    if (!view.webContents.isDestroyed()) {
      view.webContents.stop();
      view.webContents.clearHistory();

      redirectToAboutBlank(view.webContents);
      this.idleViews[view.webContents.id] = view;
    }
  }
}

export function pickMainWindowLayouts() {
  const sidebarCollapsed = desktopAppStore.get('sidebarCollapsed');

  return sidebarCollapsed ? NativeLayoutsCollapsed : NativeLayouts;
}

export function getMainWindowTopOffset() {
  return process.platform === 'darwin'
    ? 0
    : NativeAppSizes.windowTitlebarHeight;
}

export function roundRectValue(retRect: Partial<Electron.Rectangle>) {
  if (retRect.x !== undefined) retRect.x = Math.round(retRect.x);
  if (retRect.y !== undefined) retRect.y = Math.round(retRect.y);
  if (retRect.width !== undefined) retRect.width = Math.round(retRect.width);
  if (retRect.height !== undefined) retRect.height = Math.round(retRect.height);

  return retRect;
}
