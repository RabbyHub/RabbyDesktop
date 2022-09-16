import { EventEmitter } from 'events';
import { BrowserView, BrowserWindow, ipcMain } from 'electron';
import {
  NATIVE_HEADER_H,
  NATIVE_HEADER_WITH_NAV_H,
} from '../../isomorphic/const-size';
import { canoicalizeDappUrl } from '../../isomorphic/url';

type ITabOptions = {
  tabs: Tabs;
  hasNavigationBar?: boolean;
  initialUrl?: string;
};
export class Tab {
  id: BrowserView['webContents']['id'];

  initialUrl: string = '';

  view?: BrowserView;

  window?: BrowserWindow;

  webContents?: BrowserView['webContents'];

  hasNavigationBar?: boolean;

  destroyed: boolean = false;

  tabs: Tabs;

  constructor(
    parentWindow: BrowserWindow,
    { tabs, hasNavigationBar = true, initialUrl }: ITabOptions
  ) {
    this.tabs = tabs;
    this.view = new BrowserView();
    this.id = this.view.webContents.id;
    this.window = parentWindow;
    this.webContents = this.view.webContents;
    this.window.addBrowserView(this.view);
    this.hasNavigationBar = !!hasNavigationBar;
    this.initialUrl = initialUrl || '';

    const onClose = (
      _: Electron.IpcMainEvent,
      winId: Exclude<this['window'], void>['id'],
      webContentsId: Exclude<this['webContents'], void>['id']
    ) => {
      if (winId === this.window?.id && this.webContents?.id === webContentsId) {
        this.destroy();
      }
      ipcMain.off('webui-window-close', onClose);
    };

    ipcMain.on('webui-window-close', onClose);

    // TODO: only inject it for tab in extensions
    this.webContents?.executeJavaScript(`
      var origWinClose = window.close.bind(window);
      window.close = function (...args) {
        window.rabbyDesktop.ipcRenderer.sendMessage('webui-window-close', ${this.window?.id}, ${this.webContents.id});
        origWinClose(args);
      }
    `);
  }

  destroy() {
    if (this.destroyed) return;

    this.destroyed = true;

    this.hide();

    this.window!.removeBrowserView(this.view!);
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
    return this.view?.webContents.loadURL(url);
  }

  reload() {
    this.view!.webContents.reload();
  }

  show() {
    const [width, height] = this.window!.getSize();

    const topbarHeight = this.hasNavigationBar
      ? NATIVE_HEADER_WITH_NAV_H
      : NATIVE_HEADER_H;

    this.view!.setBounds({
      x: 0,
      y: topbarHeight,
      width,
      height: height - topbarHeight,
    });
    this.view!.setAutoResize({ width: true, height: true });
    // this.window.addBrowserView(this.view)
  }

  hide() {
    this.view!.setAutoResize({ width: false, height: false });
    this.view!.setBounds({ x: -1000, y: 0, width: 0, height: 0 });
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
      tabs: this
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

    return this.tabList.find((tab) =>
      canoicalizeDappUrl(tab.webContents?.getURL() || '').origin === inputOrigin
    );
  }
}
