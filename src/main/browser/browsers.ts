import { ElectronChromeExtensions } from '@rabby-wallet/electron-chrome-extensions';
import { BrowserWindow, session } from 'electron';
import { integrateQueryToUrl } from '../../isomorphic/url';
import { emitIpcMainEvent } from '../utils/ipcMainEvents';
import { Tab, Tabs } from './tabs';
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

export default class TabbedBrowserWindow {
  window: BrowserWindow;

  id: TabbedBrowserWindow['window']['id'];

  session: Electron.Session;

  extensions: TabbedBrowserWindowOptions['extensions'];

  tabs: Tabs;

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

    this.tabs = new Tabs(this.window, {
      isOfMainWindow: this.$meta.webuiType === 'MainWindow',
    });

    this.tabs.on('tab-created', (tab: Tab) => {
      const url = tab.getInitialUrl() || options.defaultTabUrl;
      if (url) {
        tab.view!.webContents.loadURL(url);
      }

      // Track tab that may have been created outside of the extensions API.
      this.extensions.addTab(tab.view!.webContents, tab.window!);
    });

    this.tabs.on('tab-selected', (tab: Tab) => {
      this.extensions.selectTab(tab.view!.webContents);
      emitIpcMainEvent('__internal_main:tabbed-window:tab-selected', {
        windowId: this.window.id,
        tabId: tab.view!.webContents.id,
      });
    });

    this.tabs.on('tab-destroyed', () => {
      this.tabs.checkLoadingView();
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

  destroy() {
    this.tabs.destroy();
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
