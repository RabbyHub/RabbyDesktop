import { EventEmitter } from 'events';

import { BrowserView, BrowserWindow } from 'electron';
import {
  NativeAppSizes,
  NativeLayouts,
  NativeLayoutsCollapsed,
} from '@/isomorphic/const-size-next';
import { NATIVE_HEADER_H } from '../../isomorphic/const-size-classical';
import { canoicalizeDappUrl } from '../../isomorphic/url';
import { emitIpcMainEvent } from '../utils/ipcMainEvents';
import { BrowserViewManager } from '../utils/browserView';
import { desktopAppStore } from '../store/desktopApp';

const viewMngr = new BrowserViewManager({
  webPreferences: {
    safeDialogs: true,
    safeDialogsMessage: 'Stop consecutive dialogs',
  },
});

type ITabOptions = {
  tabs: Tabs;
  topbarStacks?: {
    tabs?: boolean;
    navigation?: boolean;
  };
  initDetails?: Partial<chrome.tabs.CreateProperties>;
  isOfMainWindow?: boolean;
};

const dappViewTopOffset =
  NativeAppSizes.mainWindowDappTopOffset +
  (process.platform === 'darwin' ? 0 : NativeAppSizes.windowTitlebarHeight);

const DEFAULT_TOPBAR_STACKS = {
  tabs: true,
  navigation: true,
};
export class Tab {
  id: BrowserView['webContents']['id'];

  view?: BrowserView;

  window?: BrowserWindow;

  windowId?: BrowserWindow['id'];

  destroyed: boolean = false;

  tabs: Tabs;

  private $meta: {
    initDetails: ITabOptions['initDetails'];
    topbarStacks: ITabOptions['topbarStacks'];
    isOfMainWindow: boolean;
  } = {
    initDetails: {},
    topbarStacks: { ...DEFAULT_TOPBAR_STACKS },
    isOfMainWindow: false,
  };

  private _isAnimating: boolean = false;

  constructor(
    ofWindow: BrowserWindow,
    { tabs, topbarStacks, initDetails, isOfMainWindow }: ITabOptions
  ) {
    this.$meta.initDetails = { ...initDetails };
    this.$meta.topbarStacks = { ...DEFAULT_TOPBAR_STACKS, ...topbarStacks };
    this.$meta.isOfMainWindow = !!isOfMainWindow;

    this.tabs = tabs;
    this.view = viewMngr.allocateView(false);
    this.id = this.view.webContents.id;
    this.window = ofWindow;
    this.windowId = ofWindow.id;

    this.window.addBrowserView(this.view);
    emitIpcMainEvent('__internal_main:tabbed-window:view-added', {
      webContents: this.view!.webContents,
      window: ofWindow,
    });

    this.view?.webContents.on('focus', () => {
      this.tabs.emit('tab-focused');
    });

    this.view!.webContents.on('did-stop-loading', () => {
      emitIpcMainEvent('__internal_main:mainwindow:toggle-loading-view', {
        type: 'hide',
        tabId: this.id,
      });
    });

    // polyfill for window.close
    this.view?.webContents.executeJavaScript(`
      ;(function () {
        if (window.location.protocol !== 'chrome-extension:') return ;
        var origWinClose = window.close.bind(window);
        window.close = function (...args) {
          window.rabbyDesktop.ipcRenderer.sendMessage('__internal_webui-window-close', ${this.window?.id}, ${this.view?.webContents.id});
          origWinClose(args);
        }
      })();
    `);
  }

  destroy() {
    if (this.destroyed) return;

    this.destroyed = true;

    this.hide();

    if (!this.view?.webContents.isDestroyed()) {
      if (this.view?.webContents!.isDevToolsOpened()) {
        this.view?.webContents!.closeDevTools();
      }

      if (this.view!.webContents.isLoading()) {
        this.view!.webContents.stop();
      }
      // TODO: why is this no longer called?
      this.view!.webContents!.emit('destroyed');
      // this.view?.webContents!.destroy?.()
    }

    if (this.view) {
      if (!this.window?.isDestroyed()) {
        this.window!.removeBrowserView(this.view);
      }

      viewMngr.recycleView(this.view!);
    }

    this.window = undefined;
    this.view = undefined;
  }

  getInitialUrl() {
    return this.$meta.initDetails?.url;
  }

  async loadURL(url: string) {
    const isMain = this.$meta.isOfMainWindow;
    if (isMain) {
      emitIpcMainEvent('__internal_main:mainwindow:toggle-loading-view', {
        type: 'show',
        tabURL: url,
        tabId: this.id,
      });
    }
    const result = await this.view?.webContents.loadURL(url);
    if (isMain) {
      emitIpcMainEvent('__internal_main:mainwindow:toggle-loading-view', {
        type: 'hide',
        tabId: this.id,
      });
    }

    return result;
  }

  reload() {
    emitIpcMainEvent('__internal_main:mainwindow:toggle-loading-view', {
      type: 'show',
      tabURL: this.view!.webContents.getURL(),
      tabId: this.id,
    });
    this.view!.webContents.reload();
  }

  show() {
    const [width, height] = this.window!.getSize();

    const hideTopbar =
      !this.$meta.topbarStacks?.tabs && !this.$meta.topbarStacks?.navigation;

    const { isOfMainWindow } = this.$meta;
    const isCollapsedMainWindow =
      isOfMainWindow && desktopAppStore.get('sidebarCollapsed');

    const topOffset = hideTopbar ? 0 : NATIVE_HEADER_H;

    if (this._isAnimating) {
      this.view!.setAutoResize({ width: true, height: true });
      return;
    }

    this.view!.setBounds({
      x: 0,
      y: topOffset,
      width,
      height: height - topOffset,
      ...(isOfMainWindow
        ? !isCollapsedMainWindow
          ? {
              x: NativeLayouts.dappsViewLeftOffset,
              width:
                width -
                NativeLayouts.dappsViewLeftOffset -
                NativeLayouts.dappsViewRightOffset,
              y: dappViewTopOffset,
              height:
                height -
                dappViewTopOffset -
                NativeLayouts.dappsViewBottomOffset,
            }
          : {
              x: NativeLayoutsCollapsed.dappsViewLeftOffset,
              width:
                width -
                NativeLayoutsCollapsed.dappsViewLeftOffset -
                NativeLayoutsCollapsed.dappsViewRightOffset,
              y: dappViewTopOffset,
              height:
                height -
                dappViewTopOffset -
                NativeLayoutsCollapsed.dappsViewBottomOffset,
            }
        : {}),
    });
    this.view!.setAutoResize({ width: true, height: true });
  }

  setAnimatedMainWindowTabRect(rect?: Electron.Rectangle) {
    if (!this.$meta.isOfMainWindow) return;
    if (!this.view) return;

    if (!this._isAnimating) return;

    if (rect?.x) rect.x = Math.round(rect.x);
    if (rect?.y) rect.y = Math.round(rect.y);
    if (rect?.width) rect.width = Math.round(rect.width);
    if (rect?.height) rect.height = Math.round(rect.height);

    const currentBounds = this.view!.getBounds();
    this.view!.setBounds({
      ...currentBounds,
      x: -99999,
      y: -99999,
      ...rect,
    });
  }

  toggleAnimating(enabled = false) {
    this._isAnimating = enabled;
    if (enabled) {
      this.setAnimatedMainWindowTabRect();
    } else {
      this.show();
    }
  }

  hide() {
    this.view!.setAutoResize({ width: false, height: false });
    this.view!.setBounds({ x: -1000, y: 0, width: 0, height: 0 });
  }
}

export class Tabs extends EventEmitter {
  tabList: Tab[] = [];

  selected?: Tab;

  window?: BrowserWindow;

  private $meta: {
    isOfMainWindow: boolean;
  } = {
    isOfMainWindow: false,
  };

  constructor(
    browserWindow: BrowserWindow,
    opts: {
      isOfMainWindow?: boolean;
    }
  ) {
    super();
    this.window = browserWindow;

    this.$meta.isOfMainWindow = !!opts?.isOfMainWindow;
  }

  private _cleanup() {
    this.selected = undefined;
  }

  destroy() {
    this.tabList.forEach((tab) => tab.destroy());
    this.tabList = [];

    this._cleanup();

    if (this.window) {
      if (!this.window.isDestroyed()) {
        const winId = this.window.id;
        this.window.destroy();
        emitIpcMainEvent('__internal_main:tabbed-window:destroyed', winId);
      }
      this.window = undefined;
    }
  }

  get(tabId: chrome.tabs.Tab['id']) {
    return this.tabList.find((tab) => tab.id === tabId);
  }

  create(options?: Omit<ITabOptions, 'tabs'>) {
    const tab = new Tab(this.window!, {
      ...options,
      tabs: this,
    });
    this.tabList.push(tab);
    if (!this.selected) this.selected = tab;
    tab.show(); // must be attached to window
    this.emit('tab-created', tab);
    this.select(tab.id);
    return tab;
  }

  remove(tabId: chrome.tabs.Tab['id']) {
    const tabIndex = this.tabList.findIndex((tab) => tab.id === tabId);
    if (tabIndex < 0) {
      throw new Error(`Tabs.remove: unable to find tab.id = ${tabId}`);
    }
    const tab = this.tabList[tabIndex];
    this.tabList.splice(tabIndex, 1);
    tab.destroy();
    if (this.selected === tab) {
      this.selected = undefined;
      const nextTab = this.tabList[tabIndex] || this.tabList[tabIndex - 1];
      if (nextTab) this.select(nextTab.id);
    }
    this.emit('tab-destroyed', tab);
    if (this.tabList.length === 0) {
      this.emit('all-tabs-destroyed');
      if (!this.$meta.isOfMainWindow) {
        this.destroy();
      } else {
        this._cleanup();
      }
    }
  }

  select(tabId: chrome.tabs.Tab['id']) {
    const tab = this.get(tabId);
    if (!tab) return;
    if (this.selected) this.selected.hide();
    tab.show();
    this.selected = tab;
    this.emit('tab-selected', tab);
  }

  unSelectAll() {
    if (this.selected) this.selected.hide();
    this.selected = undefined;
  }

  findByOrigin(url: string) {
    const inputUrlInfo = canoicalizeDappUrl(url);
    if (!inputUrlInfo.origin) return null;

    return this.tabList.find((tab) => {
      if (!tab.view?.webContents) return false;
      const tabUrlInfo = canoicalizeDappUrl(tab.view?.webContents.getURL());
      return tabUrlInfo.origin === inputUrlInfo.origin;
    });
  }

  findByUrlbase(url: string) {
    const { urlInfo } = canoicalizeDappUrl(url);
    if (!urlInfo?.origin) return null;

    return this.tabList.find((tab) => {
      if (!tab.view?.webContents) return false;
      const { urlInfo: tabUrlInfo } = canoicalizeDappUrl(
        tab.view?.webContents.getURL()
      );
      return (
        tabUrlInfo &&
        tabUrlInfo.protocol === urlInfo.protocol &&
        tabUrlInfo.host === urlInfo.host &&
        tabUrlInfo.pathname === urlInfo.pathname
      );
    });
  }
}
