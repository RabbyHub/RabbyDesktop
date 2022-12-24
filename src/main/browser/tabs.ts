import { EventEmitter } from 'events';
import { BrowserView, BrowserWindow } from 'electron';
import { NativeAppSizes } from '@/isomorphic/const-size-next';
import { NATIVE_HEADER_H } from '../../isomorphic/const-size-classical';
import { canoicalizeDappUrl } from '../../isomorphic/url';
import { emitIpcMainEvent, onIpcMainEvent } from '../utils/ipcMainEvents';
import { dappStore } from '../store/dapps';

type ITabOptions = {
  tabs: Tabs;
  topbarStacks?: {
    tabs?: boolean;
    navigation?: boolean;
  };
  initialUrl?: string;
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
    initialUrl: ITabOptions['initialUrl'];
    topbarStacks: ITabOptions['topbarStacks'];
    isOfMainWindow: boolean;
  } = {
    initialUrl: '',
    topbarStacks: { ...DEFAULT_TOPBAR_STACKS },
    isOfMainWindow: false,
  };

  constructor(
    ofWindow: BrowserWindow,
    { tabs, topbarStacks, initialUrl, isOfMainWindow }: ITabOptions
  ) {
    this.tabs = tabs;
    this.view = new BrowserView();
    this.id = this.view.webContents.id;
    this.window = ofWindow;
    this.windowId = ofWindow.id;

    this.window.addBrowserView(this.view);

    this.view.webContents.on('did-finish-load', () => {
      emitIpcMainEvent('__internal_main:loading-view:toggle', {
        type: 'did-finish-load',
      });
    });

    this.$meta.initialUrl = initialUrl || '';
    this.$meta.topbarStacks = { ...DEFAULT_TOPBAR_STACKS, ...topbarStacks };
    this.$meta.isOfMainWindow = !!isOfMainWindow;

    this.view?.webContents.on('focus', () => {
      this.tabs.emit('tab-focused');
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

      // TODO: why is this no longer called?
      this.view?.webContents!.emit('destroyed');
      // this.view?.webContents!.destroy?.()
    }

    if (!this.window?.isDestroyed()) {
      this.window!.removeBrowserView(this.view!);
    }

    this.window = undefined;
    this.view = undefined;
  }

  getInitialUrl() {
    return this.$meta.initialUrl;
  }

  async loadURL(url: string) {
    const dapps = dappStore.get('dapps') || [];
    const { origin } = new URL(url);
    const dapp = dapps.find((item) => item.origin === origin);
    if (dapp) {
      setTimeout(() => {
        emitIpcMainEvent('__internal_main:loading-view:toggle', {
          type: 'start',
          dapp,
        });
      }, 200);
    }

    return this.view?.webContents.loadURL(url);
  }

  reload() {
    this.view!.webContents.reload();
  }

  show() {
    const [width, height] = this.window!.getSize();

    const hideTopbar =
      !this.$meta.topbarStacks?.tabs && !this.$meta.topbarStacks?.navigation;

    const topOffset = hideTopbar ? 0 : NATIVE_HEADER_H;

    this.view!.setBounds({
      x: 0,
      y: topOffset,
      width,
      height: height - topOffset,
      ...(this.$meta.isOfMainWindow
        ? {
            x: NativeAppSizes.dappsViewLeftOffset,
            width: width - NativeAppSizes.dappsViewLeftOffset,
            y: dappViewTopOffset,
            height: height - dappViewTopOffset,
          }
        : {}),
    });

    this.view!.setAutoResize({ width: true, height: true });
  }

  hide() {
    this.view!.setAutoResize({ width: false, height: false });
    this.view!.setBounds({ x: -1000, y: 0, width: 0, height: 0 });

    emitIpcMainEvent('__internal_main:loading-view:toggle', {
      type: 'did-finish-load',
    });
    // TODO: can't remove from window otherwise we lose track of which window it belongs to
    // this.window.removeBrowserView(this.view)
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
