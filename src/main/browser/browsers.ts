import { ElectronChromeExtensions } from '@rabby-wallet/electron-chrome-extensions';
import { BrowserWindow, ipcMain, session } from 'electron';
import { integrateQueryToUrl } from '../../isomorphic/url';
import { Tab, Tabs } from './tabs';

export type TabbedBrowserWindowOptions = {
  webuiExtensionId: string;
  initialUrl?: string;
  window?: Electron.BrowserWindowConstructorOptions;
  session?: Electron.Session;
  extensions: ElectronChromeExtensions;

  hasNavigationBar?: boolean;
};

export default class TabbedBrowserWindow {
  window: BrowserWindow;

  id: TabbedBrowserWindow['window']['id'];

  topbarWebContents: TabbedBrowserWindow['window']['webContents'];

  session: Electron.Session;

  extensions: TabbedBrowserWindowOptions['extensions'];

  tabs: Tabs;

  hasNavigationBar?: Exclude<
    TabbedBrowserWindowOptions['hasNavigationBar'],
    void
  > = false;

  constructor(options: TabbedBrowserWindowOptions) {
    this.session = options.session || session.defaultSession;
    this.extensions = options.extensions;

    // Can't inheret BrowserWindow
    // https://github.com/electron/electron/issues/23#issuecomment-19613241
    this.window = new BrowserWindow(options.window);
    this.id = this.window.id;
    this.topbarWebContents = this.window.webContents;
    this.hasNavigationBar = !!options.hasNavigationBar;

    const origUrl = `chrome-extension://${options.webuiExtensionId}/webui.html`;
    /* eslint-disable @typescript-eslint/naming-convention */
    const webuiUrl = integrateQueryToUrl(origUrl, {
      ...(this.hasNavigationBar && { __withNavigationbar: 'true' }),
      __webuiWindowsId: `${this.id}`,
    });
    /* eslint-enable @typescript-eslint/naming-convention */

    this.topbarWebContents.loadURL(webuiUrl);

    this.tabs = new Tabs(this.window);

    this.tabs.on('tab-created', (tab) => {
      if (options.initialUrl) {
        tab.webContents.loadURL(options.initialUrl);
      }

      // Track tab that may have been created outside of the extensions API.
      this.extensions.addTab(tab.webContents, tab.window);
    });

    this.tabs.on('tab-selected', (tab: Tab) => {
      this.extensions.selectTab(tab.webContents!);
    });

    ipcMain.on('rabby-nav-info', async (event, tabId: number) => {
      const tab = this.tabs.get(tabId);
      // const tab = this.tabs.selected;
      if (!tab) return;

      event.reply('rabby-nav-info', {
        tabExists: !!tab,
        canGoBack: tab?.webContents?.canGoBack(),
        canGoForward: tab?.webContents?.canGoForward(),
      });
    });

    queueMicrotask(() => {
      // Create initial tab
      this.tabs.create({ hasNavigationBar: this.hasNavigationBar });
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
