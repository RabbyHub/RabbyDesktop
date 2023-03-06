import { canoicalizeDappUrl, isInternalProtocol } from '@/isomorphic/url';
import {
  app,
  BrowserWindow,
  clipboard,
  Menu,
  MenuItem,
  dialog,
} from 'electron';
import { IS_RUNTIME_PRODUCTION } from '../../isomorphic/constants';
import { findDappsByOrigin } from '../store/dapps';
import { safeOpenURL } from '../streams/dappSafeview';
import {
  rabbyxQuery,
  RABBY_DESKTOP_KR_PWD,
} from '../streams/rabbyIpcQuery/_base';
import { getWindowFromWebContents, switchToBrowserTab } from '../utils/browser';
import { appendMenu, appendMenuSeparator } from '../utils/context-menu';
import { emitIpcMainEvent } from '../utils/ipcMainEvents';
import {
  getRabbyExtViews,
  getWebuiExtId,
  onMainWindowReady,
} from '../utils/stream-helpers';

const LABELS = {
  openInNewTab: (type: 'link' | Electron.ContextMenuParams['mediaType']) =>
    `Open ${type} in new tab`,
  openInNewWindow: (type: 'link' | Electron.ContextMenuParams['mediaType']) =>
    `Open ${type} in new window`,
  copyAddress: (type: 'link' | Electron.ContextMenuParams['mediaType']) =>
    `Copy ${type} address`,
  undo: 'Undo',
  redo: 'Redo',
  cut: 'Cut',
  copy: 'Copy',
  delete: 'Delete',
  paste: 'Paste',
  selectAll: 'Select All',
  back: 'Back',
  forward: 'Forward',
  reload: 'Reload',
  inspect: 'Inspect',
  addToDictionary: 'Add to dictionary',
  exitFullScreen: 'Exit full screen',
  emoji: 'Emoji',
};

const getBrowserWindowFromWebContents = (webContents: Electron.WebContents) => {
  return BrowserWindow.getAllWindows().find((win) => {
    if (win.webContents === webContents) return true;

    let browserViews: Electron.BrowserView[];

    if ('getBrowserViews' in win) {
      browserViews = win.getBrowserViews();
    } else if ('getBrowserView' in win) {
      // @ts-ignore
      browserViews = [win.getBrowserView()];
    } else {
      browserViews = [];
    }

    return browserViews.some((view) => view.webContents === webContents);
  });
};

type ChromeContextMenuLabels = typeof LABELS;

interface ChromeContextMenuOptions {
  /** Context menu parameters emitted from the WebContents 'context-menu' event. */
  params: Electron.ContextMenuParams;

  /** WebContents which emitted the 'context-menu' event. */
  webContents: Electron.WebContents;

  /** Handler for opening links. */
  openLink: (
    url: string,
    disposition: 'default' | 'foreground-tab' | 'background-tab' | 'new-window',
    params: Electron.ContextMenuParams
  ) => void;

  /** Chrome extension menu items. */
  extensionMenuItems?: MenuItem[];

  /** Labels used to create menu items. Replace this if localization is needed. */
  labels?: ChromeContextMenuLabels;

  /**
   * @deprecated Use 'labels' instead.
   */
  strings?: ChromeContextMenuLabels;
}

function buildRabbyXDebugMenu(opts: ChromeContextMenuOptions) {
  const menu = new Menu();
  appendMenu(menu, {
    label: 'Open RabbyX Background',
    click: async () => {
      const { backgroundWebContents } = await getRabbyExtViews();

      if (!backgroundWebContents.isDevToolsOpened()) {
        backgroundWebContents.openDevTools({ mode: 'detach' });
      } else if (!backgroundWebContents.isDevToolsFocused()) {
        backgroundWebContents.focus();
        getWindowFromWebContents(backgroundWebContents)?.moveTop();
      }
    },
  });

  appendMenuSeparator(menu);
  appendMenu(menu, {
    label: 'Verify RabbyX Password',
    click: async () => {
      const correct = await rabbyxQuery('walletController.verifyPassword', [
        RABBY_DESKTOP_KR_PWD,
      ])
        .then(() => true)
        .catch(() => false);

      dialog.showMessageBox({
        type: correct ? 'info' : 'warning',
        title: 'Verify Password',
        message: `Password is ${correct ? 'correct' : 'incorrect'}`,
      });
    },
  });
  appendMenu(menu, {
    label: `Trigger notification: Tx completed`,
    click: async () => {
      const { backgroundWebContents } = await getRabbyExtViews();

      backgroundWebContents.executeJavaScript(`
        chrome.notifications.create('https://polygonscan.com/tx/0x9c9d39c5e99074552c7caa33e2c3cedd25c9a21ed4190b7c9b48be3ea0111776_randomId_=1672918371781', {
          "type": "basic",
          "title": "🎉 Transaction completed",
          "iconUrl": chrome.extension.getURL('images/icon-64.png'),
          "message": "click to view more information",
          "priority": 2
        });
      `);

      rabbyxQuery('sessionService.broadcastEvent', [
        'transactionChanged',
        { type: 'finished', success: true },
      ]);
    },
  });
  appendMenu(menu, {
    label: `Trigger notification: Tx push-failed`,
    click: async () => {
      const { backgroundWebContents } = await getRabbyExtViews();

      backgroundWebContents.executeJavaScript(`
        chrome.notifications.create({
          "type": "basic",
          "title": "Transaction push failed",
          "iconUrl": chrome.extension.getURL('images/icon-64.png'),
          "message": "Transaction push failed",
        });
      `);

      rabbyxQuery('sessionService.broadcastEvent', [
        'transactionChanged',
        { type: 'push-failed' },
      ]);
    },
  });
  appendMenu(menu, {
    label: `Trigger notification: Tx submitted`,
    click: async () => {
      const { backgroundWebContents } = await getRabbyExtViews();

      backgroundWebContents.executeJavaScript(`
        chrome.notifications.create('https://polygonscan.com/tx/0x9c9d39c5e99074552c7caa33e2c3cedd25c9a21ed4190b7c9b48be3ea0111776_randomId_=1672918371781', {
          "type": "basic",
          "title": "Transaction submitted",
          "iconUrl": chrome.extension.getURL('images/icon-64.png'),
          "message": "click to view more information",
        });
      `);

      rabbyxQuery('sessionService.broadcastEvent', [
        'transactionChanged',
        { type: 'submitted' },
      ]);
    },
  });

  return menu;
}

function buildInspectKitsMenu(opts: ChromeContextMenuOptions) {
  const { params } = opts;

  const inspectKitsMenu = new Menu();

  appendMenu(inspectKitsMenu, {
    label: 'Open MetaMask Test Dapp',
    click: () => {
      const targetURL = 'https://metamask.github.io/test-dapp/';
      const targetOrigin = canoicalizeDappUrl(targetURL).origin;
      const findResult = findDappsByOrigin(targetOrigin);
      safeOpenURL(targetURL, {
        sourceURL: params.pageURL,
        existedDapp: findResult.dappByOrigin,
        existedMainDomainDapp: findResult.dappBySecondaryDomainOrigin,
      });
    },
  });

  appendMenuSeparator(inspectKitsMenu);
  appendMenu(inspectKitsMenu, {
    label: `Open DappSafeView's Content`,
    click: () => {
      emitIpcMainEvent('__internal_main:dev', {
        type: 'dapp-safe-view:open',
      });
    },
  });
  appendMenu(inspectKitsMenu, {
    label: `Inspect DappSafeView's Wrapper`,
    click: () => {
      emitIpcMainEvent('__internal_main:dev', {
        type: 'dapp-safe-view:inspect',
        viewType: 'base',
      });
    },
  });

  appendMenuSeparator(inspectKitsMenu);
  appendMenu(inspectKitsMenu, {
    label: `Open Rabby Sign's Gasket`,
    click: () => {
      emitIpcMainEvent('__internal_main:dev', {
        type: 'rabbyx-sign-gasket:toggle-show',
        nextShow: true,
      });
    },
  });
  appendMenu(inspectKitsMenu, {
    label: `Close Rabby Sign's Gasket`,
    click: () => {
      emitIpcMainEvent('__internal_main:dev', {
        type: 'rabbyx-sign-gasket:toggle-show',
        nextShow: false,
      });
    },
  });

  appendMenuSeparator(inspectKitsMenu);
  appendMenu(inspectKitsMenu, {
    label: `Capture Active Tab's Screenshot`,
    click: async () => {
      emitIpcMainEvent('__internal_main:mainwindow:capture-tab');
    },
  });

  appendMenuSeparator(inspectKitsMenu);
  appendMenu(inspectKitsMenu, {
    label: `Inspect LoadingView`,
    click: () => {
      emitIpcMainEvent('__internal_main:dev', {
        type: 'loading-view:inspect',
      });
    },
  });

  appendMenuSeparator(inspectKitsMenu);
  appendMenu(inspectKitsMenu, {
    label: `Reset App`,
    click: () => {
      emitIpcMainEvent('__internal_main:app:reset-app');
    },
  });

  return inspectKitsMenu;
}

async function buildOpenedTabsMenu(opts: ChromeContextMenuOptions) {
  const mainTabbedWin = await onMainWindowReady();

  const menu = new Menu();

  const tabList = mainTabbedWin.tabs.tabList;

  tabList.forEach((tab) => {
    if (!tab.view?.webContents) return;

    appendMenu(menu, {
      label: tab.view.webContents.getURL(),
      click: () => {
        if (!tab.view) return;
        switchToBrowserTab(tab.view.webContents.id, mainTabbedWin);
      },
    });
  });

  return menu;
}

async function buildChromeContextMenu(
  opts: ChromeContextMenuOptions
): Promise<Menu> {
  const { params, webContents, openLink, extensionMenuItems } = opts;

  const labels = opts.labels || opts.strings || LABELS;

  const menu = new Menu();
  const append = (newOpts: Electron.MenuItemConstructorOptions) =>
    appendMenu(menu, new MenuItem(newOpts));
  const appendSeparator = () => appendMenuSeparator(menu);

  const isFromBuiltinPage = isInternalProtocol(params.pageURL);
  const isBuiltinResource = params.linkURL
    ? isInternalProtocol(params.linkURL)
    : params.srcURL
    ? isInternalProtocol(params.linkURL)
    : false;

  if (
    !isFromBuiltinPage &&
    !isBuiltinResource /*  || !IS_RUNTIME_PRODUCTION */
  ) {
    if (params.linkURL) {
      // append({
      //   label: labels.openInNewTab('link'),
      //   click: () => {
      //     openLink(params.linkURL, 'default', params);
      //   },
      // });
      // append({
      //   label: labels.openInNewWindow('link'),
      //   click: () => {
      //     openLink(params.linkURL, 'new-window', params);
      //   },
      // });
      // appendSeparator();
      append({
        label: labels.copyAddress('link'),
        click: () => {
          clipboard.writeText(params.linkURL);
        },
      });
      appendSeparator();
    } else if (params.mediaType !== 'none') {
      // TODO: Loop, Show controls
      // append({
      //   label: labels.openInNewTab(params.mediaType),
      //   click: () => {
      //     openLink(params.srcURL, 'default', params);
      //   },
      // });
      append({
        label: labels.copyAddress(params.mediaType),
        click: () => {
          clipboard.writeText(params.srcURL);
        },
      });
      appendSeparator();
    }
  }

  if (params.isEditable) {
    if (params.misspelledWord) {
      params.dictionarySuggestions.forEach((suggestion) => {
        append({
          label: suggestion,
          click: () => webContents.replaceMisspelling(suggestion),
        });
      });

      if (params.dictionarySuggestions.length > 0) appendSeparator();

      append({
        label: labels.addToDictionary,
        click: () =>
          webContents.session.addWordToSpellCheckerDictionary(
            params.misspelledWord
          ),
      });
    } else {
      if (
        app.isEmojiPanelSupported() &&
        !['number', 'tel', 'other'].includes(params.inputFieldType)
      ) {
        append({
          label: labels.emoji,
          click: () => app.showEmojiPanel(),
        });
        appendSeparator();
      }

      append({
        label: labels.redo,
        enabled: params.editFlags.canRedo,
        click: () => webContents.redo(),
      });
      append({
        label: labels.undo,
        enabled: params.editFlags.canUndo,
        click: () => webContents.undo(),
      });
    }

    appendSeparator();

    append({
      label: labels.cut,
      enabled: params.editFlags.canCut,
      click: () => webContents.cut(),
    });
    append({
      label: labels.copy,
      enabled: params.editFlags.canCopy,
      click: () => webContents.copy(),
    });
    append({
      label: labels.paste,
      enabled: params.editFlags.canPaste,
      click: () => webContents.paste(),
    });
    append({
      label: labels.delete,
      enabled: params.editFlags.canDelete,
      click: () => webContents.delete(),
    });
    appendSeparator();
    if (params.editFlags.canSelectAll) {
      append({
        label: labels.selectAll,
        click: () => webContents.selectAll(),
      });
      appendSeparator();
    }
  } else if (params.selectionText) {
    append({
      label: labels.copy,
      click: () => {
        clipboard.writeText(params.selectionText);
      },
    });
    appendSeparator();
  }

  if (menu.items.length === 0) {
    const browserWindow = getBrowserWindowFromWebContents(webContents);

    // TODO: Electron needs a way to detect whether we're in HTML5 full screen.
    // Also need to properly exit full screen in Blink rather than just exiting
    // the Electron BrowserWindow.
    if (browserWindow?.fullScreen) {
      append({
        label: labels.exitFullScreen,
        click: () => browserWindow.setFullScreen(false),
      });

      appendSeparator();
    }

    append({
      label: labels.back,
      enabled: webContents.canGoBack(),
      click: () => webContents.goBack(),
    });
    append({
      label: labels.forward,
      enabled: webContents.canGoForward(),
      click: () => webContents.goForward(),
    });
    append({
      label: labels.reload,
      click: () => webContents.reload(),
    });
    appendSeparator();
  }

  if (extensionMenuItems) {
    extensionMenuItems.forEach((item) => menu.append(item));
    if (extensionMenuItems.length > 0) appendSeparator();
  }

  if (!IS_RUNTIME_PRODUCTION) {
    append({
      label: 'RabbyX Debug Kits',
      submenu: buildRabbyXDebugMenu(opts),
    });

    append({
      label: 'Views Kits',
      submenu: buildInspectKitsMenu(opts),
    });

    append({
      label: 'Opened Tabs in Main Window',
      submenu: await buildOpenedTabsMenu(opts),
    });

    appendSeparator();
    append({
      label: labels.inspect,
      click: async () => {
        // TODO non blocking if webui not inited
        const webuiExtensionId = await getWebuiExtId();

        if (
          webContents &&
          !webContents.isDevToolsOpened() &&
          webContents
            .getURL()
            .includes(`chrome-extension://${webuiExtensionId}`)
        ) {
          webContents.openDevTools({ mode: 'detach' });
          webContents.inspectElement(params.x, params.y);
        } else {
          webContents.inspectElement(params.x, params.y);
        }

        if (!webContents.isDevToolsFocused()) {
          webContents.devToolsWebContents?.focus();
        }
      },
    });
  }

  return menu;
}

export default buildChromeContextMenu;
