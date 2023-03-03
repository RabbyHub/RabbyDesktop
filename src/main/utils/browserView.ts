import {
  NativeAppSizes,
  NativeLayouts,
  NativeLayoutsCollapsed,
} from '@/isomorphic/const-size-next';
import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import {
  BrowserView,
  BrowserViewConstructorOptions,
  WebContents,
  webContents,
} from 'electron';
import { desktopAppStore } from '../store/desktopApp';
import { redirectToAboutBlank } from './browser';

const ghostViewIds = new Set<WebContents['id']>();

export class BrowserViewManager {
  private idleViews: Record<number, BrowserView> = {};

  private busyViews: Record<number, BrowserView> = {};

  constructor(
    private viewOpts: BrowserViewConstructorOptions,
    private opts?: {
      destroyOnRecycle?: boolean;
    }
  ) {}

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

      redirectToAboutBlank(view.webContents);
      view.webContents.clearHistory();
      this.idleViews[view.webContents.id] = view;

      if (this.opts?.destroyOnRecycle) {
        this._destroyView(view);
      }
    }
  }

  private _destroyView(view: BrowserView) {
    if (view.webContents.isDestroyed()) return;

    // then try to destroy it
    try {
      const viewId = view.webContents.id;

      view.webContents.close();
      // make sure you detach it from BrowserWindow first
      (view.webContents as any).destroy();
      delete this.idleViews[viewId];
      delete this.busyViews[viewId];
      ghostViewIds.add(viewId);

      console.debug(
        `[BrowserViewManager::recycleView] try to destroy webContents '${viewId}'`
      );

      if (!IS_RUNTIME_PRODUCTION) {
        setTimeout(() => {
          const shouldBeDeleted = webContents
            .getAllWebContents()
            .find((wc) => wc.id === viewId);
          if (shouldBeDeleted) {
            console.debug(
              `[BrowserViewManager::recycleView] webContents '${viewId}' not deleted, isDestroyed: ${shouldBeDeleted.isDestroyed()}`
            );
          }
        }, 0);
      }
    } catch (err) {
      console.debug(
        '[BrowserViewManager::recycleView] failed to destroy webContents',
        err
      );
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
