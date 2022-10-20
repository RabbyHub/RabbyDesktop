import { EventEmitter } from 'events';
import { BrowserView, BrowserWindow } from 'electron';
import {
  NATIVE_HEADER_H,
  NATIVE_HEADER_WITH_NAV_H,
} from '../../isomorphic/const-size';
import { canoicalizeDappUrl, isUrlFromDapp } from '../../isomorphic/url';
import { onIpcMainEvent } from '../utils/ipcMainEvents';
import { RABBY_LOADING_URL } from '../../isomorphic/constants';
import { dappStore } from '../store/dapps';
import { attachAlertBrowserView } from '../streams/dappAlert';

type ITabOptions = {
  tabs: Tabs;
  topbarStacks?: {
    tabs?: boolean;
    navigation?: boolean;
  };
  initialUrl?: string;
};

const DEFAULT_TOPBAR_STACKS = {
  tabs: true,
  navigation: true,
};
export class Tab {
  id: BrowserView['webContents']['id'];

  initialUrl: string = '';

  view?: BrowserView;

  window?: BrowserWindow;

  loadingView?: BrowserView;

  webContents?: BrowserView['webContents'];

  topbarStacks: ITabOptions['topbarStacks'] = { ...DEFAULT_TOPBAR_STACKS };

  destroyed: boolean = false;

  tabs: Tabs;

  constructor(
    parentWindow: BrowserWindow,
    { tabs, topbarStacks, initialUrl }: ITabOptions
  ) {
    this.tabs = tabs;
    this.view = new BrowserView();
    this.id = this.view.webContents.id;
    this.window = parentWindow;
    this.webContents = this.view.webContents;
    this.window.addBrowserView(this.view);
    this.initialUrl = initialUrl || '';

    this.loadingView = new BrowserView();
    this.loadingView.webContents.loadURL(RABBY_LOADING_URL);
    this.window.addBrowserView(this.loadingView);

    this.view.webContents.on('did-finish-load', () => {
      this.loadingView?.webContents.send('did-finish-load', null);
      this.window?.removeBrowserView(this.loadingView!);
    });

    this.topbarStacks = { ...DEFAULT_TOPBAR_STACKS, ...topbarStacks };

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

    this.webContents.on('will-redirect', (evt) => {
      const sender = (evt as any).sender as BrowserView['webContents'];

      const url = sender.getURL();
      // this tabs is render as app's self UI, such as topbar.
      if (isUrlFromDapp(url)) {
        evt.preventDefault();
        attachAlertBrowserView(url);
      }
    });
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

  async loadURL(url: string) {
    const dapps = dappStore.get('dapps') || [];
    const { origin } = new URL(url);
    const dapp = dapps.find((item) => item.origin === origin);
    if (dapp) {
      setTimeout(() => {
        this.loadingView?.webContents.send('load-dapp', dapp);
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
      !this.topbarStacks?.tabs && !this.topbarStacks?.navigation;
    const hasNavigationBar = !!this.topbarStacks?.navigation;

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
    const inputOrigin = canoicalizeDappUrl(url).origin;
    if (!inputOrigin) return null;

    return this.tabList.find(
      (tab) =>
        canoicalizeDappUrl(tab.webContents?.getURL() || '').origin ===
        inputOrigin
    );
  }
}
