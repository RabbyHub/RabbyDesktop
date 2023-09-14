import { BrowserWindow, session } from 'electron';
import { ElectronChromeExtensions } from '@rabby-wallet/electron-chrome-extensions';
import * as Sentry from '@sentry/electron/main';
import { SimplePool } from '@/isomorphic/pool';

import { formatDappHttpOrigin } from '@/isomorphic/dapp';
import { integrateQueryToUrl, isSpecialDappID } from '../../isomorphic/url';
import {
  emitIpcMainEvent,
  onIpcMainEvent,
  sendToWebContents,
} from '../utils/ipcMainEvents';
import { MainWindowTab, Tab, Tabs } from './tabs';
import { IS_RUNTIME_PRODUCTION } from '../../isomorphic/constants';

export type TabbedBrowserWindowOptions = {
  webuiExtensionId: string;
  webuiType?: IShellWebUIType;
  defaultTabUrl?: string;
  window?: Electron.BrowserWindowConstructorOptions;
  session?: Electron.Session;
  extensions: ElectronChromeExtensions;
  windowType?: Exclude<chrome.windows.CreateData, void>['type'];
  queryStringArgs?: {
    [key: `__webui${string}`]: string | number | boolean;
  };

  defaultOpen?: boolean;
};

const CRASH_REASONS = [
  // 'clean-exit',
  'abnormal-exit',
  'killed',
  'crashed',
  'oom',
  'launch-failed',
  'integrity-failure',
];

export default class TabbedBrowserWindow<TTab extends Tab = Tab> {
  window: BrowserWindow;

  id: TabbedBrowserWindow['window']['id'];

  session: Electron.Session;

  extensions: TabbedBrowserWindowOptions['extensions'];

  tabs: Tabs<TTab>;

  // TODO: develop style for popup window
  // - [x] NO Close button
  // - [ ] No Tab Style, just transparent
  // - [x] No Navigation Bar
  windowType: Exclude<TabbedBrowserWindowOptions['windowType'], void>;

  private $meta: {
    hasNavigationBar: boolean;
    defaultOpen: boolean;
    webuiType?: IShellWebUIType;
  } = {
    hasNavigationBar: false,
    defaultOpen: true,
    webuiType: undefined,
  };

  private _perfInfoPool = new SimplePool<IWebviewPerfInfo>();

  private _listenerReportPool = new SimplePool<IEventEmitterListenerReport>(3);

  constructor(options: TabbedBrowserWindowOptions) {
    this.session = options.session || session.defaultSession;
    this.extensions = options.extensions;

    // Can't inheret BrowserWindow
    // https://github.com/electron/electron/issues/23#issuecomment-19613241
    this.window = new BrowserWindow(options.window);
    this.windowType = options.windowType || 'normal';
    this.id = this.window.id;

    this.$meta.hasNavigationBar = this.windowType !== 'popup';
    this.$meta.defaultOpen = options.defaultOpen !== false;
    this.$meta.webuiType = options.webuiType || undefined;

    const origUrl = `chrome-extension://${options.webuiExtensionId}/webui.html`;
    /* eslint-disable @typescript-eslint/naming-convention */
    const webuiUrl = integrateQueryToUrl(origUrl, {
      ...options.queryStringArgs,
      ...(this.$meta.hasNavigationBar && { __withNavigationbar: 'true' }),
      ...(options.webuiType && { __webuiType: options.webuiType }),
      // TODO: set 'false' for 'popup' window
      __webuiClosable: this.windowType !== 'popup' ? 'true' : 'false',
      ...(!IS_RUNTIME_PRODUCTION && {
        __webuiWindowsId: `${this.id}`,
      }),
    });
    /* eslint-enable @typescript-eslint/naming-convention */

    this.window.webContents.loadURL(webuiUrl);

    if (this.isMainWindow()) {
      // leave here for debug
      if (!IS_RUNTIME_PRODUCTION)
        this.window.webContents.openDevTools({ mode: 'detach' });

      this.window.setMaxListeners(100);
      const disposeOnReportPerfInfo = onIpcMainEvent(
        '__internal_rpc:browser:report-perf-info',
        (evt, perfInfo) => {
          if (evt.sender !== this.window.webContents) return;

          this._perfInfoPool.push(perfInfo);

          const listenerCountRpoert = this._getAllEventsListenerCount();
          this._listenerReportPool.push(listenerCountRpoert);
          // TODO: leave here for debug
          // if (!IS_RUNTIME_PRODUCTION) {
          //   console.debug('listenerCountRpoert', listenerCountRpoert);
          // }
        }
      );

      this.window.webContents.on('render-process-gone', (_, details) => {
        if (CRASH_REASONS.includes(details.reason)) {
          emitIpcMainEvent('__internal_main:mainwindow:webContents-crashed');
        }
        disposeOnReportPerfInfo();

        // sort by time desc
        const perfInfos = this._perfInfoPool
          .getPool()
          .sort((a, b) => b.time - a.time);

        const lastPerfItem = perfInfos[0];
        const lastWaterMark = !lastPerfItem
          ? null
          : lastPerfItem.memoryInfo.usedJSHeapSize /
            lastPerfItem.memoryInfo.totalJSHeapSize;

        Sentry.captureEvent({
          message: 'WebContents Crashed',
          tags: {
            webContentsType: 'MainWindow',
            goneReason: details.reason,
          },
          extra: {
            lastWaterMark,
            lastPerfItem,
            perfInfos,
            details,
            listenerReport: this._listenerReportPool.getPool(),
          },
        });
      });
    }

    this.tabs = new Tabs(this.window, {
      webuiType: this.$meta.webuiType,
    });

    this.tabs.on('tab-created', (tab: Tab) => {
      const url = tab.getInitialUrl() || options.defaultTabUrl;
      if (url) {
        tab._webContents?.loadURL(url);
      }

      // Track tab that may have been created outside of the extensions API.
      this.extensions.addTab(tab._webContents!, tab.window!);
      this._pushDappsBoundIds();
    });

    this.tabs.on('tab-selected', (tab: Tab, prevTab?: Tab) => {
      this.extensions.selectTab(tab._webContents!);
      emitIpcMainEvent('__internal_main:tabbed-window:tab-selected', {
        windowId: this.window.id,
        tabId: tab._webContents!.id,
      });
    });

    this.tabs.on('tab-destroyed', (tab: Tab) => {
      this.tabs.checkLoadingView();
      this._pushDappsBoundIds();

      if (tab?.relatedDappId) {
        emitIpcMainEvent(
          '__internal_main:dapp:confirm-dapp-updated',
          tab?.relatedDappId
        );
      }
    });

    emitIpcMainEvent('__internal_main:tabbed-window:view-added', {
      webContents: this.window.webContents,
      window: this.window,
      tabbedWindow: this,
    });

    queueMicrotask(() => {
      // Create initial tab
      if (!this.isMainWindow() && this.$meta.defaultOpen) {
        this.createTab({
          topbarStacks: this.isRabbyXNotificationWindow()
            ? {
                tabs: false,
                navigation: false,
              }
            : {
                tabs: true,
                navigation: this.$meta.hasNavigationBar,
              },
        });
      }
    });
  }

  private _getAllEventsListenerCount() {
    return this.window.eventNames().reduce(
      (accu, event) => {
        const count = this.window.listenerCount(event);
        // TODO: ignore symbol type event temporarily
        if (typeof event === 'string') accu.events[event] = count;
        accu.total += count;

        return accu;
      },
      {
        total: 0,
        events: {},
      } as IEventEmitterListenerReport
    );
  }

  private _pushDappsBoundIds() {
    if (!this.isMainWindow()) return;

    const dappBoundTabIds = this.tabs.tabList.reduce((acc, tab) => {
      if (!tab._webContents) return acc;
      if (!tab.relatedDappId) return acc;

      if (tab.relatedDappId) {
        acc[tab.relatedDappId] = tab._webContents!.id;
        if (isSpecialDappID(tab.relatedDappId)) {
          acc[formatDappHttpOrigin(tab.relatedDappId)] = tab._webContents!.id;
        }
      }

      return acc;
    }, {} as IDappBoundTabIds);

    sendToWebContents(
      this.window.webContents,
      '__internal_push:dapps:changed',
      {
        dappBoundTabIds,
      }
    );
  }

  destroy() {
    this.tabs.destroy();

    this._pushDappsBoundIds();
    this.window.destroy();
  }

  isMainWindow() {
    return this.$meta.webuiType === 'MainWindow';
  }

  isForTrezorLikeConnection() {
    return this.$meta.webuiType === 'ForTrezorLike';
  }

  isRabbyXNotificationWindow() {
    return this.$meta.webuiType === 'RabbyX-NotificationWindow';
  }

  getFocusedTab() {
    return this.tabs.selected;
  }

  getMeta() {
    return { ...this.$meta };
  }

  createTab(options?: Parameters<Tabs['create']>[0]) {
    return this.tabs.create({
      ...options,
      webuiType: this.$meta.webuiType,
    });
  }

  sendMessageToShellUI(message: string, ...args: any[]) {
    this.window.webContents.send(message, ...args);
  }
}

export type MainTabbedBrowserWindow = TabbedBrowserWindow<MainWindowTab>;
