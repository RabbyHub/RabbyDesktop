import { ElectronChromeExtensions } from '@rabby-wallet/electron-chrome-extensions';
import { BrowserWindow, session } from 'electron';
import { getOrPutCheckResult } from '../utils/dapps';
import { integrateQueryToUrl, isUrlFromDapp } from '../../isomorphic/url';
import { onIpcMainEvent } from '../utils/ipcMainEvents';
import { Tab, Tabs } from './tabs';

export type TabbedBrowserWindowOptions = {
  webuiExtensionId: string;
  defaultTabUrl?: string;
  window?: Electron.BrowserWindowConstructorOptions;
  session?: Electron.Session;
  extensions: ElectronChromeExtensions;
  windowType?: Exclude<chrome.windows.CreateData, void>['type'];
};

export default class TabbedBrowserWindow {
  window: BrowserWindow;

  id: TabbedBrowserWindow['window']['id'];

  topbarWebContents: TabbedBrowserWindow['window']['webContents'];

  session: Electron.Session;

  extensions: TabbedBrowserWindowOptions['extensions'];

  tabs: Tabs;

  // TODO: develop style for popup window
  // - [x] NO Close button
  // - [ ] No Tab Style, just transparent
  // - [x] No Navigation Bar
  windowType: Exclude<TabbedBrowserWindowOptions['windowType'], void>;

  hasNavigationBar: boolean = false;

  constructor(options: TabbedBrowserWindowOptions) {
    this.session = options.session || session.defaultSession;
    this.extensions = options.extensions;

    // Can't inheret BrowserWindow
    // https://github.com/electron/electron/issues/23#issuecomment-19613241
    this.window = new BrowserWindow(options.window);
    this.windowType = options.windowType || 'normal';
    this.id = this.window.id;
    this.topbarWebContents = this.window.webContents;
    this.hasNavigationBar = this.windowType !== 'popup';

    const origUrl = `chrome-extension://${options.webuiExtensionId}/shell-webui.html`;
    /* eslint-disable @typescript-eslint/naming-convention */
    const webuiUrl = integrateQueryToUrl(origUrl, {
      ...(this.hasNavigationBar && { __withNavigationbar: 'true' }),
      // TODO: set 'false' for 'popup' window
      __webuiClosable: this.windowType !== 'popup' ? 'true' : 'false',
      __webuiWindowsId: `${this.id}`,
    });
    /* eslint-enable @typescript-eslint/naming-convention */

    this.topbarWebContents.loadURL(webuiUrl);

    this.tabs = new Tabs(this.window);

    this.tabs.on('tab-created', (tab: Tab) => {
      const url = tab.initialUrl || options.defaultTabUrl;
      if (url) {
        tab.webContents!.loadURL(url);
      }

      // Track tab that may have been created outside of the extensions API.
      this.extensions.addTab(tab.webContents!, tab.window!);
    });

    this.tabs.on('tab-selected', (tab: Tab) => {
      this.extensions.selectTab(tab.webContents!);
    });

    onIpcMainEvent('webui-ext-navinfo', async (event, tabId) => {
      const tab = this.tabs.get(tabId);
      // TODO: always respond message
      if (!tab) return;

      const tabUrl = tab.webContents!.getURL();
      const checkResult = isUrlFromDapp(tabUrl)
        ? await getOrPutCheckResult(tabUrl, { updateOnSet: false })
        : null;

      event.reply('webui-ext-navinfo', {
        tabExists: !!tab,
        tabUrl,
        dappSecurityCheckResult: checkResult,
        canGoBack: tab?.webContents?.canGoBack(),
        canGoForward: tab?.webContents?.canGoForward(),
      });
    });

    queueMicrotask(() => {
      // Create initial tab
      this.tabs.create({
        topbarStacks: {
          tabs: true,
          navigation: this.hasNavigationBar,
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
}
