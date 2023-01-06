import {
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
      redirectToAboutBlank(view.webContents);
      this.idleViews[view.webContents.id] = view;
    }
  }
}

export function pickMainWindowLayouts() {
  const sidebarCollapsed = desktopAppStore.get('sidebarCollapsed');

  return sidebarCollapsed ? NativeLayoutsCollapsed : NativeLayouts;
}
