import { BrowserView, BrowserViewConstructorOptions } from 'electron';
import { redirectToAboutBlank } from './browser';

export class BrowserViewManager {
  private idleViews: Record<number, BrowserView> = {};

  private busyViews: Record<number, BrowserView> = {};

  constructor(private viewOpts: BrowserViewConstructorOptions) {}

  allocateView() {
    let view = Object.values(this.idleViews)[0];

    if (!view || view.webContents.isDestroyed()) {
      view = new BrowserView({
        ...this.viewOpts,
      });
    }

    delete this.idleViews[view.webContents.id];
    this.busyViews[view.webContents.id] = view;
    view.webContents.loadURL('about:blank');

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
