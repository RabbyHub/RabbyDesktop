import { EventEmitter } from 'events';

import { BrowserView, BrowserWindow, webContents } from 'electron';
import {
  NativeAppSizes,
  NativeLayouts,
  NativeLayoutsCollapsed,
} from '@/isomorphic/const-size-next';
import { DAPP_ZOOM_VALUES, EnumMatchDappType } from '@/isomorphic/constants';
import { formatZoomValue } from '@/isomorphic/primitive';
import { isTabUrlEntryOfHttpDappOrigin } from '@/isomorphic/dapp';
import { Observable, Subject, filter, firstValueFrom } from 'rxjs';
import { randString } from '@/isomorphic/string';
import { NATIVE_HEADER_H } from '../../isomorphic/const-size-classical';
import {
  canoicalizeDappUrl,
  extractDappInfoFromURL,
} from '../../isomorphic/url';
import {
  emitIpcMainEvent,
  handleIpcMainInvoke,
  sendToWebContents,
} from '../utils/ipcMainEvents';
import {
  BrowserViewManager,
  parseSiteMetaByWebContents,
  patchTabbedBrowserWebContents,
} from '../utils/browserView';
import { desktopAppStore } from '../store/desktopApp';
import { getAssetPath } from '../utils/app';
import { hideLoadingView, isDappViewLoadingForTab } from '../utils/browser';
import {
  notifyShowFindInPage,
  notifyHideFindInPage,
} from '../utils/mainTabbedWin';
import { getMainWindowTopOffset } from '../utils/browserSize';
import { getRabbyExtId } from '../utils/stream-helpers';

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

type CreatedWindowPayload = {
  tabUid: string;
  tabWebContentsId: number;
  windowWebContentsId: number;
};
export const WebviewTagBasedViewOb$s = {
  createdWebview: new Subject<CreatedWindowPayload>(),
};

const isDarwin = process.platform === 'darwin';

type ITabOptions = {
  tabs: Tabs;
  topbarStacks?: {
    tabs?: boolean;
    navigation?: boolean;
  };
  initDetails?: Partial<chrome.tabs.CreateProperties>;
  webuiType?: IShellWebUIType;
  dappZoomPercent?: number;
  relatedDappId?: string;
};

const dappViewTopOffset =
  NativeAppSizes.mainWindowDappTopOffset + getMainWindowTopOffset();

const DEFAULT_TOPBAR_STACKS = {
  tabs: true,
  navigation: true,
};
export abstract class Tab {
  protected webContents?: Electron.WebContents;

  protected _waitTabCreated: Promise<CreatedWindowPayload>;

  tabUid: string;

  get isAnimating() {
    return false;
  }

  get tabWebContents() {
    return this.webContents;
  }

  get tabId() {
    return this.tabWebContents?.id;
  }

  window?: BrowserWindow;

  windowId?: BrowserWindow['id'];

  destroyed: boolean = false;

  tabs: Tabs;

  protected $meta: {
    initDetails: ITabOptions['initDetails'];
    topbarStacks: ITabOptions['topbarStacks'];
    webuiType?: IShellWebUIType;
    dappZoomPercent?: number;
    relatedDappId: ITabOptions['relatedDappId'];
  } = {
    initDetails: {},
    topbarStacks: { ...DEFAULT_TOPBAR_STACKS },
    webuiType: undefined,
    dappZoomPercent: DAPP_ZOOM_VALUES.DEFAULT_ZOOM_PERCENT,
    relatedDappId: '',
  };

  protected _isAnimating: boolean = false;

  protected _isVisible: boolean = false;

  constructor(ofWindow: BrowserWindow, tabOptions: ITabOptions) {
    const { tabs, topbarStacks, initDetails, relatedDappId } = tabOptions;

    this.$meta.initDetails = { ...initDetails };
    this.$meta.topbarStacks = { ...DEFAULT_TOPBAR_STACKS, ...topbarStacks };
    this.$meta.webuiType = tabOptions.webuiType;
    this.$meta.relatedDappId = relatedDappId || '';

    if (this.$meta.webuiType === 'ForSpecialHardware') {
      this.$meta.topbarStacks.tabs = true;
    } else if (this.$meta.webuiType === 'Prompt') {
      this.$meta.topbarStacks.tabs = false;
      this.$meta.topbarStacks.navigation = false;
    }

    this.tabs = tabs;
    let dappZoomPercent = tabOptions.dappZoomPercent;
    if (this.$meta.webuiType === 'MainWindow') {
      if (!dappZoomPercent) {
        console.warn(
          'dappZoomPercent is not set for main window, use default value'
        );
        dappZoomPercent = DAPP_ZOOM_VALUES.DEFAULT_ZOOM_PERCENT;
      }
    } else {
      dappZoomPercent = 100;
    }
    this.$meta.dappZoomPercent = dappZoomPercent;

    this.window = ofWindow;
    this.windowId = ofWindow.id;

    this.$meta.relatedDappId = tabOptions.relatedDappId;
    if (this.$meta.relatedDappId && this.$meta.webuiType !== 'MainWindow') {
      throw new Error(
        `Tab of dapp must be of main window, but got relatedDappId: ${this.$meta.relatedDappId}`
      );
    }

    this.tabUid = randString();

    // TODO: use one promise never resolved
    this._waitTabCreated = Promise.resolve<CreatedWindowPayload>({
      tabUid: this.tabUid,
      tabWebContentsId: -1,
      windowWebContentsId: ofWindow.webContents.id,
    });

    this.initTab(ofWindow);
  }

  async whenWebContentsReady() {
    await this._waitTabCreated;

    return this;
  }

  /* @override */
  protected abstract initTab(ofWindow: BrowserWindow): void;

  protected _setupWebContentsOnTabCreated(
    thisTabWebContents: Electron.WebContents
  ) {
    emitIpcMainEvent('__internal_main:tabbed-window:view-added', {
      webContents: thisTabWebContents,
      window: this.window!,
    });
    emitIpcMainEvent('__internal_main:tabbed-window:tab-added', {
      webContents: thisTabWebContents,
      window: this.window!,
      relatedDappId: this.$meta.relatedDappId,
      isMainTabbedWindow: this.isOfMainWindow,
    });

    thisTabWebContents.on('focus', () => {
      this.tabs.emit('tab-focused');
    });

    thisTabWebContents.on('page-favicon-updated', async (evt, favicons) => {
      const wc = thisTabWebContents;
      if (!wc || !this.relatedDappId) return;
      const currentURL =
        thisTabWebContents.getURL() ||
        (await wc.executeJavaScript('window.location.href'));
      if (!currentURL) return;

      const currentInfo = canoicalizeDappUrl(currentURL);
      const relatedInfo = canoicalizeDappUrl(this.relatedDappId);
      if (currentInfo.secondaryDomain !== relatedInfo.secondaryDomain) return;

      const sitemeta = await parseSiteMetaByWebContents(wc);
      emitIpcMainEvent('__internal_main:tabbed-window:tab-favicon-updated', {
        matchedRelatedDappId: this.relatedDappId,
        matchedType:
          currentInfo.origin === relatedInfo.origin
            ? EnumMatchDappType.byOrigin
            : EnumMatchDappType.bySecondaryDomain,
        linkRelIcons: sitemeta.linkRelIcons,
        favicons: sitemeta.favicons,
      });
    });

    thisTabWebContents.on('did-stop-loading', () => {
      if (isDappViewLoadingForTab(thisTabWebContents.id)) hideLoadingView();
    });

    thisTabWebContents.on('dom-ready', () => {
      if (isDappViewLoadingForTab(thisTabWebContents.id)) hideLoadingView();

      const currentURL = thisTabWebContents.getURL() || '';
      if (
        currentURL &&
        this.relatedDappId &&
        extractDappInfoFromURL(this.relatedDappId).type === 'http' &&
        isTabUrlEntryOfHttpDappOrigin(currentURL, this.relatedDappId)
      ) {
        emitIpcMainEvent(
          '__internal_main:dapp:confirm-dapp-updated',
          this.relatedDappId
        );
      }
    });

    this._patchWindowBuiltInMethods(thisTabWebContents);

    this.tabs.emit('tab-webcontents-created', {
      tabUid: this.tabUid,
      tabWebContentsId: thisTabWebContents.id,
    });
  }

  /** @internal */
  _patchWindowBuiltInMethods(thisTabWebContents = this.tabWebContents) {
    if (!thisTabWebContents || thisTabWebContents.isDestroyed()) return;

    patchTabbedBrowserWebContents(thisTabWebContents, {
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
    return this.$meta.webuiType === 'ForSpecialHardware';
  }

  showLoadingView(nextURL: string) {
    emitIpcMainEvent('__internal_main:mainwindow:toggle-loading-view', {
      type: 'show',
      tabId: this.tabId!,
      tabURL: nextURL,
    });
  }

  /** @override */
  protected abstract _cleanupTab(): void;

  /** @override */
  protected _onWebContentsInitialized(ctx: {
    webContents: Electron.WebContents;
    tab: Tab;
  }) {}

  destroy() {
    if (this.destroyed) return;

    const lastOpenInfo = this.makeTabLastOpenInfo();
    this.destroyed = true;

    this._cleanupTab();
    this.hide();

    if (!this.tabWebContents || !this.tabWebContents.isDestroyed()) {
      if (this.tabWebContents!.isDevToolsOpened()) {
        this.tabWebContents!.closeDevTools();
      }

      if (this.tabWebContents?.isLoading()) {
        this.tabWebContents.stop();
      }
      // TODO: why is this no longer called?
      this.tabWebContents!.emit('destroyed');
      // this.tabWebContents!.destroy?.()
    }

    this.window = undefined;
    // this.view = undefined;

    emitIpcMainEvent('__internal_main:tabbed-window:tab-destroyed', {
      windowId: this.windowId!,
      tabId: this.tabId!,
    });

    if (lastOpenInfo) {
      emitIpcMainEvent('__internal_main:mainwindow:dapp-tabs-to-be-closed', {
        tabs: lastOpenInfo,
      });
    }
  }

  makeTabLastOpenInfo(): IDappLastOpenInfo | null {
    if (!this.isOfMainWindow) return null;

    let finalURL = '';
    try {
      finalURL = this.tabWebContents?.getURL() || '';

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
    const result = await this.tabWebContents?.loadURL(url);
    if (isMain) {
      emitIpcMainEvent('__internal_main:mainwindow:capture-tab');
      hideLoadingView();
    }

    return result;
  }

  reload(force = false) {
    if (!this.tabWebContents) return;
    this.showLoadingView(this.tabWebContents.getURL());
    if (force) {
      this.tabWebContents.reloadIgnoringCache();
    } else {
      this.tabWebContents.reload();
    }
  }

  /* @override */
  protected abstract _adjustWindowRect(viewBounds: Electron.Rectangle): void;

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

    this._adjustWindowRect(viewBounds);
  }

  hide() {
    this._isVisible = false;
  }

  get relatedDappId() {
    return this.$meta.relatedDappId;
  }
}

export class BrowserViewTab extends Tab {
  private view?: BrowserView;

  constructor(...[parentWindow, options]: ConstructorParameters<typeof Tab>) {
    super(parentWindow, { ...options });

    this.view = viewMngr.allocateView({
      webPreferences: {
        zoomFactor: formatZoomValue(this.$meta.dappZoomPercent!).zoomFactor,
      },
    });

    const ofWindow = this.window!;
    ofWindow.addBrowserView(this.view);
    this.webContents = this.view.webContents;
    this._waitTabCreated = Promise.resolve<CreatedWindowPayload>({
      tabUid: this.tabUid,
      tabWebContentsId: this.webContents.id,
      windowWebContentsId: ofWindow.webContents.id,
    });

    this._setupWebContentsOnTabCreated(this.webContents);
  }

  protected initTab(ofWindow: BrowserWindow) {}

  protected _cleanupTab() {}

  protected _adjustWindowRect(viewBounds: Electron.Rectangle) {
    if (this._isAnimating) {
      this.view?.setAutoResize({ width: true, height: true });
      return;
    }
    this.view?.setBounds(viewBounds);
    this.view?.setAutoResize({ width: true, height: true });
  }

  hide() {
    super.hide();

    if (!this.view) return;

    this.view.setAutoResize({ width: false, height: false });
    if (isDarwin) {
      const oldBounds = this.view.getBounds();
      this.view.setBounds({
        ...oldBounds,
        x: -1000 - oldBounds.width,
        y: -1000 - oldBounds.height,
      });
    } else {
      this.view.setBounds({ x: -1000, y: -1000, width: 0, height: 0 });
    }
  }

  destroy() {
    if (this.view) {
      if (!this.window?.isDestroyed()) {
        this.window!.removeBrowserView(this.view);
      }

      viewMngr.recycleView(this.view!);
    }
    this.view = undefined;
    super.destroy();
  }
}

handleIpcMainInvoke(
  '__internal_rpc:tabbed-window2:created-webview',
  (evt, payload) => {
    WebviewTagBasedViewOb$s.createdWebview.next({
      tabUid: payload.tabUid,
      tabWebContentsId: payload.tabWebContentsId,
      windowWebContentsId: evt.sender.id,
    });
  }
);

const DEFAULT_FIND_IN_PAGE_STATE = {
  windowOpen: false,
  requestId: -1,
  searchText: '',
  result: null,
};

export class MainWindowTab extends Tab {
  private _findInPageState: {
    windowOpen: boolean;
    requestId: number;
    searchText: string;
    result?: Electron.Result | null;
  } = { ...DEFAULT_FIND_IN_PAGE_STATE };

  constructor(...[parentWindow, options]: ConstructorParameters<typeof Tab>) {
    super(parentWindow, { ...options, webuiType: 'MainWindow' });
  }

  protected _cleanupTab() {
    this._findInPageState = { ...DEFAULT_FIND_IN_PAGE_STATE };
  }

  protected initTab(ofWindow: BrowserWindow) {
    this._waitTabCreated = firstValueFrom(
      WebviewTagBasedViewOb$s.createdWebview.pipe(
        filter(
          (creation) =>
            creation.windowWebContentsId === ofWindow.webContents.id &&
            creation.tabUid === this.tabUid
        )
      )
    ).then((creation) => {
      this.webContents = webContents.fromId(creation.tabWebContentsId);
      return creation;
    });

    this._waitTabCreated.then(() => {
      this._setupWebContentsOnTabCreated(this.webContents!);
    });

    getRabbyExtId().then((rabbyExtId) => {
      sendToWebContents(
        ofWindow.webContents,
        '__internal_push:tabbed-window2:create-webview',
        {
          tabUid: this.tabUid,
          windowId: ofWindow.id,
          relatedDappId: this.$meta.relatedDappId,
          additionalData: {
            preloadPath: getAssetPath('./preloads/dappViewPreload.js'),
            blankPage: `chrome-extension://${rabbyExtId}/blank.html`,
          },
          tabMeta: {
            initDetails: this.$meta.initDetails,
            webuiType: this.$meta.webuiType,
            relatedDappId: this.$meta.relatedDappId,
          },
        }
      );
    });
  }

  protected _adjustWindowRect(viewBounds: Electron.Rectangle) {
    if (!this.window?.webContents.isDestroyed()) {
      sendToWebContents(
        this.tabs.window?.webContents,
        '__internal_push:tabbed-window2:show-webview',
        {
          tabUid: this.tabUid,
          windowId: this.windowId!,
          viewBounds,
          isDappWebview: this.isOfMainWindow,
        }
      );
    }
  }

  protected _onWebContentsInitialized(ctx: {
    webContents: Electron.WebContents;
    tab: Tab;
  }): void {
    ctx.webContents.on('found-in-page', async (_, result) => {
      this._findInPageState = {
        ...this._findInPageState,
        requestId: result.requestId,
        result,
      };
      emitIpcMainEvent('__internal_main:mainwindow:update-findresult-in-page', {
        tabId: ctx.webContents.id,
        find: { result, searchText: this._findInPageState.searchText },
      });
    });
  }

  set findInPageState(state: Partial<MainWindowTab['_findInPageState']>) {
    Object.assign(this._findInPageState, state);
  }

  get findInPageState(): MainWindowTab['_findInPageState'] {
    return { ...this._findInPageState };
  }

  // TODO: should we only call this method for selected tab?
  resumeFindInPage(searchText = '') {
    if (this.destroyed) return;
    // if (!this.view) return;
    if (!this.tabWebContents) return;
    if (!this._isVisible || this.isAnimating) return;

    let requestId = this._findInPageState.requestId;
    if (searchText) {
      requestId =
        this.tabWebContents.findInPage(searchText, {
          findNext: true,
        }) || -1;

      this.findInPageState = { searchText, requestId };
    } else if (requestId <= 0) {
      this.tabWebContents.stopFindInPage('clearSelection');
      this.resetFindInPage();
    }

    this.findInPageState = { ...this.findInPageState, windowOpen: true };

    // const viewBounds = this.view.getBounds();
    // notifyShowFindInPage({ x: viewBounds.x, y: viewBounds.y }, this.tabId!);
  }

  clearFindInPageResult() {
    if (this.destroyed) return;
    if (!this.tabWebContents || this.tabWebContents.isDestroyed()) return;

    this.tabWebContents.stopFindInPage('clearSelection');
    emitIpcMainEvent('__internal_main:mainwindow:update-findresult-in-page', {
      tabId: this.tabWebContents.id,
      find: { result: null, searchText: '' },
    });
  }

  resetFindInPage() {
    if (this.destroyed) return;

    this.clearFindInPageResult();
    notifyHideFindInPage();
    this.findInPageState = { ...DEFAULT_FIND_IN_PAGE_STATE };
  }

  setAnimatedMainWindowTabRect(rect?: Electron.Rectangle) {
    if (!this.isOfMainWindow) return;
    // if (!this.view) return;

    if (!this._isAnimating) return;

    if (rect?.x) rect.x = Math.round(rect.x);
    if (rect?.y) rect.y = Math.round(rect.y);
    if (rect?.width) rect.width = Math.round(rect.width);
    if (rect?.height) rect.height = Math.round(rect.height);

    // const currentBounds = this.view!.getBounds();
    // this._adjustWindowRect({
    //   ...currentBounds,
    //   x: -99999,
    //   y: -99999,
    //   // ...rect,
    // });
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

    if (this.findInPageState.windowOpen) {
      if (enabled) {
        notifyHideFindInPage();
      } else {
        this.resumeFindInPage(this._findInPageState.searchText);
      }
    }
  }

  show() {
    this._pushPrevFindInPageResult();
    super.show();
  }

  hide() {
    this.clearFindInPageResult();
    notifyHideFindInPage();
    super.hide();
  }

  destroy() {
    this.resetFindInPage();
    super.destroy();
  }

  private _pushPrevFindInPageResult() {
    if (!this.tabWebContents) return;
    emitIpcMainEvent('__internal_main:mainwindow:update-findresult-in-page', {
      tabId: this.tabWebContents.id,
      find: {
        result: this._findInPageState.result || null,
        searchText: this._findInPageState.searchText || '',
      },
    });
  }

  matchRelatedDappInfo(dappOrigin: string | ICanonalizedUrlInfo) {
    if (!this.isOfMainWindow || !this.$meta.relatedDappId) return null;

    const parsedInfo =
      typeof dappOrigin === 'string'
        ? canoicalizeDappUrl(dappOrigin)
        : dappOrigin;

    if (!parsedInfo) return null;

    const result = {
      matchedOrigin: '',
      matchedType: null as null | EnumMatchDappType,
    };

    if (parsedInfo.origin === this.$meta.relatedDappId) {
      result.matchedOrigin = parsedInfo.origin;
      result.matchedType = EnumMatchDappType.byOrigin;
      return result;
    }
    if (parsedInfo.secondaryOrigin === this.$meta.relatedDappId) {
      result.matchedOrigin = parsedInfo.secondaryOrigin;
      result.matchedType = EnumMatchDappType.bySecondaryDomain;
      return result;
    }

    return null;
  }
}

type AllTabType = BrowserViewTab | MainWindowTab;
export class Tabs<TTab extends Tab = Tab> extends EventEmitter {
  tabList: TTab[] = [];

  selected?: TTab;

  window?: BrowserWindow;

  private $meta: {
    webuiType?: IShellWebUIType;
  } = {
    webuiType: undefined,
  };

  constructor(
    browserWindow: BrowserWindow,
    opts: {
      isOfMainWindow?: boolean;
      webuiType?: IShellWebUIType;
    }
  ) {
    super();
    this.window = browserWindow;

    this.$meta.webuiType = opts?.webuiType;
  }

  private _cleanup() {
    this._unselect();
  }

  private _unselect() {
    this.selected = undefined;
    this.emit('tab-selected-changed', { selected: null });
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

  private get isOfMainWindow() {
    return this.$meta.webuiType === 'MainWindow';
  }

  get(tabId: chrome.tabs.Tab['id']) {
    return this.tabList.find((tab) => tab.tabId === tabId);
  }

  async create(options?: Omit<ITabOptions, 'tabs'>) {
    const args = [
      this.window!,
      {
        ...options,
        tabs: this,
        webuiType: this.$meta.webuiType,
      },
    ] as const;

    const tab = (options?.webuiType === 'MainWindow' && this.isOfMainWindow
      ? new MainWindowTab(...args)
      : new BrowserViewTab(...args)) as any as TTab;

    await tab.whenWebContentsReady();
    this.tabList.push(tab);
    if (!this.selected) this.selected = tab;
    tab.show(); // must be attached to window

    this.emit('tab-created', tab);
    this.select(tab.tabId);
    return tab;
  }

  remove(tabId: chrome.tabs.Tab['id']) {
    const tabIndex = this.tabList.findIndex((tab) => tab.tabId === tabId);
    if (tabIndex < 0) {
      throw new Error(`Tabs.remove: unable to find tab.id = ${tabId}`);
    }
    const tab = this.tabList[tabIndex];
    this.tabList.splice(tabIndex, 1);
    tab.destroy();
    if (this.selected === tab) {
      this._unselect();
      const nextTab = this.tabList[tabIndex] || this.tabList[tabIndex - 1];
      if (nextTab) this.select(nextTab.tabId);
    }
    this.emit('tab-destroyed', tab);
    if (this.tabList.length === 0) {
      this.emit('all-tabs-destroyed');
      if (!this.isOfMainWindow) {
        this.destroy();
      } else {
        this._cleanup();
      }
    }
  }

  select(tabId: chrome.tabs.Tab['id']) {
    const tab = this.get(tabId);
    if (!tab) return;
    const prevSelected = this.selected;
    if (prevSelected && !prevSelected.destroyed) prevSelected.hide();

    tab.show();
    this.selected = tab;
    this.emit('tab-selected', tab, prevSelected);
    this.emit('tab-selected-changed', { selected: tab });

    return tab;
  }

  unSelectAll() {
    if (this.selected) this.selected.hide();
    this._unselect();
  }

  checkLoadingView() {
    const tab = this.selected;

    if (!tab || !tab.tabWebContents?.isLoading() || tab.isAnimating) {
      hideLoadingView();
      return false;
    }

    const targetURL = tab.tabWebContents.getURL();

    tab.showLoadingView(targetURL);

    return true;
  }

  findByOrigin(url: string) {
    const inputUrlInfo = canoicalizeDappUrl(url);
    if (!inputUrlInfo.origin) return null;

    return this.tabList.find((tab) => {
      if (!tab.tabWebContents) return false;
      const tabUrlInfo = canoicalizeDappUrl(tab.tabWebContents.getURL());
      return tabUrlInfo.origin === inputUrlInfo.origin;
    });
  }

  /** @deprecated */
  findBySecondaryDomain(inputURL: string) {
    const inputUrlInfo = canoicalizeDappUrl(inputURL);
    if (!inputUrlInfo.secondaryDomain) return null;

    return this.tabList.find((tab) => {
      if (!tab.tabWebContents) return false;
      const tabUrlInfo = canoicalizeDappUrl(tab.tabWebContents.getURL());
      return tabUrlInfo.secondaryDomain === inputUrlInfo.secondaryDomain;
    });
  }

  findByUrlbase(url: string) {
    const { urlInfo } = canoicalizeDappUrl(url);
    if (!urlInfo?.origin) return null;

    return this.tabList.find((tab) => {
      if (!tab.tabWebContents) return false;
      const { urlInfo: tabUrlInfo } = canoicalizeDappUrl(
        tab.tabWebContents.getURL()
      );
      return (
        tabUrlInfo &&
        tabUrlInfo.protocol === urlInfo.protocol &&
        tabUrlInfo.host === urlInfo.host &&
        tabUrlInfo.pathname === urlInfo.pathname
      );
    });
  }

  filterTab(filterFn: (ctx: { tab: Tab; tabURL: string }) => boolean) {
    return this.tabList.filter((tab) => {
      if (!tab.tabWebContents) return false;

      return filterFn({
        tab,
        tabURL: tab.tabWebContents.getURL(),
      });
    });
  }
}
