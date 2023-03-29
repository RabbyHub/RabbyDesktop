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
import {
  BrowserViewManager,
  patchTabbedBrowserWebContents,
} from '../utils/browserView';
import { desktopAppStore } from '../store/desktopApp';
import { getAssetPath } from '../utils/app';
import { hideLoadingView, isDappViewLoadingForTab } from '../utils/browser';
import {
  notifyStartFindInPage,
  notifyStopFindInPage,
} from '../utils/mainTabbedWin';

const viewMngr = new BrowserViewManager(
  {
    webPreferences: {
      safeDialogs: true,
      safeDialogsMessage: 'Stop consecutive dialogs',
      preload: getAssetPath('./preloads/dappViewPreload.js'),
      webviewTag: false,
    },
  },
  {
    destroyOnRecycle: true,
  }
);

const isDarwin = process.platform === 'darwin';

type ITabOptions = {
  tabs: Tabs;
  topbarStacks?: {
    tabs?: boolean;
    navigation?: boolean;
  };
  initDetails?: Partial<chrome.tabs.CreateProperties>;
  webuiType?: IShellWebUIType;
  relatedDappId?: string;
};

const dappViewTopOffset =
  NativeAppSizes.mainWindowDappTopOffset +
  (isDarwin ? 0 : NativeAppSizes.windowTitlebarHeight);

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
    webuiType?: IShellWebUIType;
    relatedDappId: ITabOptions['relatedDappId'];
  } = {
    initDetails: {},
    topbarStacks: { ...DEFAULT_TOPBAR_STACKS },
    webuiType: undefined,
    relatedDappId: '',
  };

  private _isAnimating: boolean = false;

  protected _isVisible: boolean = false;

  constructor(ofWindow: BrowserWindow, tabOptions: ITabOptions) {
    const { tabs, topbarStacks, initDetails } = tabOptions;

    this.$meta.initDetails = { ...initDetails };
    this.$meta.topbarStacks = { ...DEFAULT_TOPBAR_STACKS, ...topbarStacks };
    this.$meta.webuiType = tabOptions.webuiType;

    if (this.$meta.webuiType === 'ForTrezorLike') {
      this.$meta.topbarStacks.tabs = true;
    } else if (this.$meta.webuiType === 'Prompt') {
      this.$meta.topbarStacks.tabs = false;
      this.$meta.topbarStacks.navigation = false;
    }

    this.tabs = tabs;
    this.view = viewMngr.allocateView(false);
    this.id = this.view.webContents.id;
    this.window = ofWindow;
    this.windowId = ofWindow.id;

    this.$meta.relatedDappId = tabOptions.relatedDappId;
    if (this.$meta.relatedDappId && this.$meta.webuiType !== 'MainWindow') {
      throw new Error(
        `Tab of dapp must be of main window, but got relatedDappId: ${this.$meta.relatedDappId}`
      );
    }

    this.window.addBrowserView(this.view);
    emitIpcMainEvent('__internal_main:tabbed-window:view-added', {
      webContents: this.view!.webContents,
      window: ofWindow,
    });

    this.view?.webContents.on('focus', () => {
      this.tabs.emit('tab-focused');
    });

    this.view?.webContents.on('page-favicon-updated', (evt, favicons) => {
      const currentURL = this.view?.webContents.getURL();
      if (!currentURL) return;

      const dappOrigin = canoicalizeDappUrl(currentURL).origin;
      emitIpcMainEvent('__internal_main:tabbed-window:tab-favicon-updated', {
        dappOrigin,
        favicons,
      });
    });

    this.view!.webContents.on('did-stop-loading', () => {
      if (isDappViewLoadingForTab(this.id)) hideLoadingView();
    });

    this.view!.webContents.on('dom-ready', () => {
      if (isDappViewLoadingForTab(this.id)) hideLoadingView();
    });

    this._patchWindowClose();
  }

  /** @internal */
  _patchWindowClose() {
    patchTabbedBrowserWebContents(this.view!.webContents, {
      windowId: this.windowId,
    });
  }

  get isOfPrompt() {
    return this.$meta.webuiType === 'Prompt';
  }

  get isOfMainWindow() {
    return this.$meta.webuiType === 'MainWindow';
  }

  get isOfTreasureLikeConnection() {
    return this.$meta.webuiType === 'ForTrezorLike';
  }

  showLoadingView(nextURL: string) {
    emitIpcMainEvent('__internal_main:mainwindow:toggle-loading-view', {
      type: 'show',
      tabId: this.id,
      tabURL: nextURL,
    });
  }

  protected _cleanupTab() {}

  destroy() {
    if (this.destroyed) return;

    const lastOpenInfo = this.makeTabLastOpenInfo();
    this.destroyed = true;

    this._cleanupTab();
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

    emitIpcMainEvent('__internal_main:tabbed-window:tab-destroyed', {
      windowId: this.windowId!,
      tabId: this.id,
    });

    if (lastOpenInfo) {
      emitIpcMainEvent('__internal_main:mainwindow:dapp-tabs-to-be-closed', {
        tabs: lastOpenInfo,
      });
    }

    this.window = undefined;
    this.view = undefined;
  }

  makeTabLastOpenInfo(): IDappLastOpenInfo | null {
    if (!this.isOfMainWindow) return null;

    let finalURL = '';
    try {
      finalURL = this.view?.webContents.getURL() || '';

      if (!finalURL) return null;
      return { finalURL };
    } catch (e) {
      // ignore
    }

    return null;
  }

  getInitialUrl() {
    return this.$meta.initDetails?.url;
  }

  async loadURL(url: string) {
    const isMain = this.isOfMainWindow;
    if (isMain) {
      emitIpcMainEvent('__internal_main:mainwindow:capture-tab', {
        type: 'clear',
      });
      this.showLoadingView(url);
    }
    const result = await this.view?.webContents.loadURL(url);
    if (isMain) {
      emitIpcMainEvent('__internal_main:mainwindow:capture-tab');
      hideLoadingView();
    }

    return result;
  }

  reload() {
    this.showLoadingView(this.view!.webContents.getURL());
    this.view!.webContents.reload();
  }

  show() {
    const [width, height] = this.window!.getSize();

    const hideTopbar =
      !this.$meta.topbarStacks?.tabs && !this.$meta.topbarStacks?.navigation;

    const isCollapsedMainWindow =
      this.isOfMainWindow && desktopAppStore.get('sidebarCollapsed');

    const topOffset = hideTopbar
      ? 0
      : !this.isOfTreasureLikeConnection
      ? NATIVE_HEADER_H
      : NativeAppSizes.trezorLikeConnectionWindowHeaderHeight;

    this._isVisible = true;

    if (this._isAnimating) {
      this.view!.setAutoResize({ width: true, height: true });
      return;
    }

    const viewBounds = {
      x: 0,
      y: topOffset,
      width,
      height: height - topOffset,
      ...(this.isOfMainWindow
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
    };

    this.view!.setBounds(viewBounds);
    this.view!.setAutoResize({ width: true, height: true });
  }

  setAnimatedMainWindowTabRect(rect?: Electron.Rectangle) {
    if (!this.isOfMainWindow) return;
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
      // ...rect,
    });
  }

  get isAnimating() {
    return this._isAnimating;
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
    this._isVisible = false;

    this.view!.setAutoResize({ width: false, height: false });
    if (isDarwin) {
      const oldBounds = this.view!.getBounds();
      this.view!.setBounds({
        ...oldBounds,
        x: -1000 - oldBounds.width,
        y: -1000 - oldBounds.height,
      });
    } else {
      this.view!.setBounds({ x: -1000, y: -1000, width: 0, height: 0 });
    }
  }

  getRelatedDappInfo(dappOrigin: string | ICanonalizedUrlInfo) {
    if (!this.isOfMainWindow || !this.$meta.relatedDappId) return null;

    const parsedInfo =
      typeof dappOrigin === 'string'
        ? canoicalizeDappUrl(dappOrigin)
        : dappOrigin;

    if (!parsedInfo) return null;

    const result = {
      matchedOrigin: '',
      matchedType: 'by-origin' as 'by-origin' | 'by-secondary-domain',
    };

    if (parsedInfo.origin === this.$meta.relatedDappId) {
      result.matchedOrigin = parsedInfo.origin;
      result.matchedType = 'by-origin';
      return result;
    }
    if (parsedInfo.secondaryDomain === this.$meta.relatedDappId) {
      result.matchedOrigin = parsedInfo.secondaryDomain;
      result.matchedType = 'by-secondary-domain';
      return result;
    }

    return null;
  }
}

export class MainWindowTab extends Tab {
  private _findInPageState: {
    requestId: number;
    searchText: string;
    result?: Electron.Result | null;
  } = { requestId: -1, searchText: '' };

  constructor(...[parentWindow, options]: ConstructorParameters<typeof Tab>) {
    super(parentWindow, { ...options, webuiType: 'MainWindow' });

    this.view!.webContents.on('found-in-page', async (_, result) => {
      this._findInPageState = {
        ...this._findInPageState,
        requestId: result.requestId,
        result,
      };
      emitIpcMainEvent('__internal_main:mainwindow:update-findresult-in-page', {
        tabId: this.id,
        find: { result, searchText: this._findInPageState.searchText },
      });
    });
  }

  protected _cleanupTab() {
    super._cleanupTab();
    this._findInPageState = { requestId: -1, searchText: '' };
  }

  set findInPageState(state: Partial<MainWindowTab['_findInPageState']>) {
    Object.assign(this._findInPageState, state);
  }

  get findInPageState(): MainWindowTab['_findInPageState'] {
    return { ...this._findInPageState };
  }

  // TODO: should we only call this method for selected tab?
  tryStartFindInPage(searchText = '') {
    if (this.destroyed) return;
    if (!this.view) return;
    if (!this._isVisible || this.isAnimating) return;

    let requestId = this._findInPageState.requestId;
    if (searchText) {
      requestId =
        this.view?.webContents.findInPage(searchText, {
          findNext: true,
        }) || -1;

      this.findInPageState = { searchText, requestId };
    } else if (requestId <= 0) {
      this.view?.webContents.stopFindInPage('clearSelection');
      this.resetFindInPage();
    }

    const viewBounds = this.view.getBounds();
    notifyStartFindInPage({ x: viewBounds.x, y: viewBounds.y }, this.id);
  }

  clearFindInPageResult() {
    if (this.destroyed) return;

    this.view?.webContents.stopFindInPage('clearSelection');
    emitIpcMainEvent('__internal_main:mainwindow:update-findresult-in-page', {
      tabId: this.id,
      find: { result: null, searchText: '' },
    });
  }

  resetFindInPage() {
    if (this.destroyed) return;

    this.clearFindInPageResult();
    notifyStopFindInPage();
    this.findInPageState = { requestId: -1, searchText: '', result: null };
  }

  show() {
    this._pushPrevFindInPageResult();
    super.show();
  }

  hide() {
    this.clearFindInPageResult();
    notifyStopFindInPage();
    super.hide();
  }

  destroy() {
    this.resetFindInPage();
    super.destroy();
  }

  rePosFindWindow() {
    if (!this.view) return;

    const viewBounds = this.view.getBounds();
    notifyStartFindInPage({ x: viewBounds.x, y: viewBounds.y }, this.id);
  }

  private _pushPrevFindInPageResult() {
    emitIpcMainEvent('__internal_main:mainwindow:update-findresult-in-page', {
      tabId: this.id,
      find: {
        result: this._findInPageState.result || null,
        searchText: this._findInPageState.searchText || '',
      },
    });
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
    const args = [
      this.window!,
      {
        ...options,
        tabs: this,
      },
    ] as const;
    const tab =
      options?.webuiType === 'MainWindow' && this.$meta.isOfMainWindow
        ? new MainWindowTab(...args)
        : new Tab(...args);
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

    return tab;
  }

  unSelectAll() {
    if (this.selected) this.selected.hide();
    this.selected = undefined;
  }

  checkLoadingView() {
    const tab = this.selected;

    if (!tab || !tab.view?.webContents.isLoading() || tab.isAnimating) {
      hideLoadingView();
      return false;
    }

    const targetURL = tab.view!.webContents.getURL();

    tab.showLoadingView(targetURL);

    return true;
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

  findBySecondaryDomain(inputURL: string) {
    const inputUrlInfo = canoicalizeDappUrl(inputURL);
    if (!inputUrlInfo.secondaryDomain) return null;

    return this.tabList.find((tab) => {
      if (!tab.view?.webContents) return false;
      const tabUrlInfo = canoicalizeDappUrl(tab.view?.webContents.getURL());
      return tabUrlInfo.secondaryDomain === inputUrlInfo.secondaryDomain;
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

  filterTab(filterFn: (tabURL: string) => boolean) {
    return this.tabList.filter((tab) => {
      if (!tab.view?.webContents) return false;
      return filterFn(tab.view?.webContents.getURL());
    });
  }
}
