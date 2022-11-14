import { EventEmitter } from 'events';
import { BrowserView, BrowserWindow } from 'electron';
import {
  NATIVE_HEADER_H,
  NATIVE_HEADER_WITH_NAV_H,
  RABBY_PANEL_SIZE,
} from '../../isomorphic/const-size';
import { canoicalizeDappUrl } from '../../isomorphic/url';
import { onIpcMainEvent, sendToWebContents } from '../utils/ipcMainEvents';
import { RABBY_LOADING_URL } from '../../isomorphic/constants';
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

const DEFAULT_TOPBAR_STACKS = {
  tabs: true,
  navigation: true,
};
export class Tab {
  id: BrowserView['webContents']['id'];

  view?: BrowserView;

  window?: BrowserWindow;

  loadingView?: BrowserView;

  webContents?: BrowserView['webContents'];

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

    this.webContents = this.view.webContents;
    this.window.addBrowserView(this.view);

    this.loadingView = new BrowserView();
    this.loadingView.webContents.loadURL(RABBY_LOADING_URL);
    this.window.addBrowserView(this.loadingView);

    this.view.webContents.on('did-finish-load', () => {
      sendToWebContents(
        this.view!.webContents,
        '__internal_push:loading-view:dapp-did-finish-load',
        {}
      );
      this.window?.removeBrowserView(this.loadingView!);
    });

    this.$meta.initialUrl = initialUrl || '';
    this.$meta.topbarStacks = { ...DEFAULT_TOPBAR_STACKS, ...topbarStacks };
    this.$meta.isOfMainWindow = !!isOfMainWindow;

    const dispose = onIpcMainEvent(
      '__internal_webui-window-close',
      (_, winId, webContentsId) => {
        if (
          winId === this.window?.id &&
          this.webContents?.id === webContentsId
        ) {
          this.destroy();
        }
        dispose();
      }
    );

    // polyfill for window.close
    this.webContents?.executeJavaScript(`
      ;(function () {
        if (window.location.protocol !== 'chrome-extension:') return ;
        var origWinClose = window.close.bind(window);
        window.close = function (...args) {
          window.rabbyDesktop.ipcRenderer.sendMessage('__internal_webui-window-close', ${this.window?.id}, ${this.webContents.id});
          origWinClose(args);
        }
      })();
    `);
  }

  destroy() {
    if (this.destroyed) return;

    this.destroyed = true;

    this.hide();

    this.window!.removeBrowserView(this.view!);
    this.window!.removeBrowserView(this.loadingView!);
    this.window = undefined;

    if (this.webContents!.isDevToolsOpened()) {
      this.webContents!.closeDevTools();
    }

    // TODO: why is this no longer called?
    this.webContents!.emit('destroyed');

    // this.webContents!.destroy?.()
    this.webContents = undefined;

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
        sendToWebContents(
          this.view!.webContents,
          '__internal_push:loading-view:load-dapp',
          dapp
        );
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
    const hasNavigationBar = !!this.$meta.topbarStacks?.navigation;

    const topbarHeight = hideTopbar
      ? 0
      : hasNavigationBar
      ? NATIVE_HEADER_WITH_NAV_H
      : NATIVE_HEADER_H;

    this.loadingView!.setBounds({
      x: 0,
      y: topbarHeight,
      width,
      height: height - topbarHeight,
    });
    this.loadingView!.setAutoResize({ width: true, height: true });
    // this.window.addBrowserView(this.view)

    this.view!.setBounds({
      x: 0,
      y: topbarHeight,
      width,
      ...(this.$meta.isOfMainWindow && {
        width: width - RABBY_PANEL_SIZE.width,
      }),
      height: height - topbarHeight,
    });
    this.view!.setAutoResize({ width: true, height: true });
  }

  hide() {
    this.view!.setAutoResize({ width: false, height: false });
    this.view!.setBounds({ x: -1000, y: 0, width: 0, height: 0 });
    this.loadingView!.setAutoResize({ width: false, height: false });
    this.loadingView!.setBounds({ x: -1000, y: 0, width: 0, height: 0 });
    // TODO: can't remove from window otherwise we lose track of which window it belongs to
    // this.window.removeBrowserView(this.view)
  }
}

export class Tabs extends EventEmitter {
  tabList: Tab[] = [];

  selected?: Tab;

  window?: BrowserWindow;

  constructor(browserWindow: BrowserWindow) {
    super();
    this.window = browserWindow;
  }

  destroy() {
    this.tabList.forEach((tab) => tab.destroy());
    this.tabList = [];

    this.selected = undefined;

    // TODO: allow to customize behavior on destroy()
    if (this.window) {
      this.window.destroy();
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
      this.destroy();
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

  findByOrigin(url: string) {
    const inputUrlInfo = canoicalizeDappUrl(url);
    if (!inputUrlInfo.origin) return null;

    return this.tabList.find((tab) => {
      if (!tab.webContents) return false;
      const tabUrlInfo = canoicalizeDappUrl(tab.webContents.getURL());
      return tabUrlInfo.origin === inputUrlInfo.origin;
    });
  }

  findByUrlbase(url: string) {
    const { urlInfo } = canoicalizeDappUrl(url);
    if (!urlInfo?.origin) return null;

    return this.tabList.find((tab) => {
      if (!tab.webContents) return false;
      const { urlInfo: tabUrlInfo } = canoicalizeDappUrl(
        tab.webContents.getURL()
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
