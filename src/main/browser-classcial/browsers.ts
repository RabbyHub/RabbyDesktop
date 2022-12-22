import { ElectronChromeExtensions } from '@rabby-wallet/electron-chrome-extensions';
import { BrowserWindow, session } from 'electron';
import { getOrPutCheckResult } from '../utils/dapps';
import { integrateQueryToUrl, isUrlFromDapp } from '../../isomorphic/url';
import { onIpcMainEvent } from '../utils/ipcMainEvents';
import { Tab, Tabs } from './tabs';
import { IS_RUNTIME_PRODUCTION } from '../../isomorphic/constants';

export type TabbedBrowserWindowOptions = {
  webuiExtensionId: string;
  defaultTabUrl?: string;
  window?: Electron.BrowserWindowConstructorOptions;
  session?: Electron.Session;
  extensions: ElectronChromeExtensions;
  windowType?: Exclude<chrome.windows.CreateData, void>['type'];
  queryStringArgs?: {
    [key: `__webui${string}`]: string | number | boolean;
  };

  isMainWindow?: boolean;
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
    isMainWindow: boolean;
  } = {
    hasNavigationBar: false,
    isMainWindow: false,
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
    this.$meta.isMainWindow = !!options.isMainWindow;

    const origUrl = `chrome-extension://${options.webuiExtensionId}/webui.html`;
    /* eslint-disable @typescript-eslint/naming-convention */
    const webuiUrl = integrateQueryToUrl(origUrl, {
      ...options.queryStringArgs,
      ...(this.$meta.hasNavigationBar && { __withNavigationbar: 'true' }),
      ...(this.$meta.isMainWindow && { __webuiIsMainWindow: 'true' }),
      // TODO: set 'false' for 'popup' window
      __webuiClosable: this.windowType !== 'popup' ? 'true' : 'false',
      ...(!IS_RUNTIME_PRODUCTION && {
        __webuiWindowsId: `${this.id}`,
      }),
    });
    /* eslint-enable @typescript-eslint/naming-convention */

    this.window.webContents.loadURL(webuiUrl);

    this.tabs = new Tabs(this.window);

    this.tabs.on('tab-created', (tab: Tab) => {
      const url = tab.getInitialUrl() || options.defaultTabUrl;
      if (url) {
        tab.webContents?.loadURL(url);
      }

      // Track tab that may have been created outside of the extensions API.
      this.extensions.addTab(tab.webContents!, tab.window!);
    });

    this.tabs.on('tab-selected', (tab: Tab) => {
      this.extensions.selectTab(tab.webContents!);
    });

    onIpcMainEvent(
      '__internal_rpc:webui-ext:navinfo',
      async (event, reqid, tabId) => {
        const tab = this.tabs.get(tabId);
        // TODO: always respond message
        if (!tab) return;

        const tabUrl = tab.webContents!.getURL();
        const checkResult = isUrlFromDapp(tabUrl)
          ? await getOrPutCheckResult(tabUrl, { updateOnSet: false })
          : null;

        event.reply('__internal_rpc:webui-ext:navinfo', {
          reqid,
          tabNavInfo: {
            tabExists: !!tab,
            tabUrl,
            dappSecurityCheckResult: checkResult,
            canGoBack: tab?.webContents?.canGoBack(),
            canGoForward: tab?.webContents?.canGoForward(),
          },
        });
      }
    );

    queueMicrotask(() => {
      // Create initial tab
      this.createTab({
        topbarStacks: {
          tabs: true,
          navigation: this.$meta.hasNavigationBar,
        },
      });
    });
  }

  destroy() {
    this.tabs.destroy();
    this.window.destroy();
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
      isOfMainWindow: this.$meta.isMainWindow,
    });
  }

  sendMessageToShellUI(message: string, ...args: any[]) {
    this.window.webContents.send(message, ...args);
  }
}
