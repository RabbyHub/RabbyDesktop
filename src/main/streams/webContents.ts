import { formatDapps } from '@/isomorphic/dapp';
import { isUrlFromDapp } from '@/isomorphic/url';
import TabbedBrowserWindow from '../browser/browsers';
import { dappStore, parseDappUrl } from '../store/dapps';
import { switchToBrowserTab } from '../utils/browser';
import { onIpcMainEvent } from '../utils/ipcMainEvents';
import { attachAlertBrowserView } from './dappAlert';
import { openDappSecurityCheckView } from './securityCheck';

/**
 * @see https://www.electronjs.org/docs/latest/api/window-open
 *
 * it should intercept theses ways to navigate:
 *
 * - clicking on links or submitting forms adorned with target=_blank
 * - JavaScript calling window.open()
 */
export function setOpenHandlerForWebContents({
  webContents,
  parentTabbedWin,
}: {
  webContents: Electron.WebContents;
  parentTabbedWin: TabbedBrowserWindow;
}) {
  webContents.setWindowOpenHandler((details) => {
    if (!webContents) return { action: 'deny' };

    const currentUrl = webContents.getURL();
    // actually, it's always from dapp on isMainContentsForTabbedWindow=false
    const isFromDapp = isUrlFromDapp(currentUrl);
    const dapps = formatDapps(dappStore.get('dapps'));

    const currentInfo = parseDappUrl(currentUrl, dapps);
    const targetInfo = parseDappUrl(details.url, dapps);
    const sameOrigin = currentInfo.origin === targetInfo.origin;

    const isToExt = details.url.startsWith('chrome-extension://');

    if (isFromDapp && !sameOrigin) {
      attachAlertBrowserView(
        details.url,
        targetInfo.existedOrigin,
        parentTabbedWin.window
      );
    } else if (!isToExt) {
      switch (details.disposition) {
        case 'foreground-tab':
        case 'background-tab':
        case 'new-window': {
          const openedDapp = parentTabbedWin?.tabs.findByOrigin(details.url);
          if (openedDapp) {
            switchToBrowserTab(openedDapp!.id, parentTabbedWin!);
          } else {
            const continualOpenedTab = parentTabbedWin.createTab({
              initDetails: details,
            });
            continualOpenedTab?.loadURL(details.url);

            const closeOpenedTab = () => {
              continualOpenedTab?.destroy();
            };

            openDappSecurityCheckView(details.url, parentTabbedWin.window).then(
              ({ continualOpId }) => {
                // TODO: use timeout mechanism to avoid memory leak
                const dispose = onIpcMainEvent(
                  '__internal_rpc:security-check:continue-close-dapp',
                  (_evt, _openId) => {
                    if (parentTabbedWin.window && _openId === continualOpId) {
                      dispose?.();
                      closeOpenedTab();
                    }
                  }
                );
              }
            );
          }
          break;
        }
        default: {
          break;
        }
      }
    }

    return {
      action: 'deny',
    };
  });
}

export const setListeners = {
  /**
   * @see https://www.electronjs.org/docs/latest/api/web-contents#event-will-redirect
   *
   * Emitted when a server side redirect occurs during navigation. For example a 302 redirect.
   */
  'will-redirect': (webContents: Electron.WebContents) => {
    webContents.on('will-redirect', (evt, targetURL) => {
      if (!webContents) return;
      const currentURL = webContents.getURL();

      // this tabs is render as app's self UI, such as topbar.
      if (!isUrlFromDapp(currentURL)) return;

      evt.preventDefault();
      attachAlertBrowserView(targetURL);
    });
  },

  /**
   * @see https://www.electronjs.org/docs/latest/api/web-contents#event-will-navigate
   *
   * it should intercept these ways to navigate:
   *
   * - window.location object is changed
   * - click a link with target != "_blank"
   */
  'will-navigate': (
    webContents: Electron.WebContents,
    parentWindow: Electron.BrowserWindow
  ) => {
    webContents.on(
      'will-navigate',
      (evt: Electron.Event, targetURL: string) => {
        const evtWebContents = (evt as any).sender as Electron.WebContents;
        const currentUrl = evtWebContents.getURL();

        // actually, it's always from dapp on isMainContentsForTabbedWindow=false
        const isFromDapp = isUrlFromDapp(currentUrl);

        const dapps = formatDapps(dappStore.get('dapps'));

        const currentInfo = parseDappUrl(currentUrl, dapps);
        const targetInfo = parseDappUrl(targetURL, dapps);
        const sameOrigin = currentInfo.origin === targetInfo.origin;

        if (isFromDapp && !sameOrigin) {
          evt.preventDefault();
          attachAlertBrowserView(
            targetURL,
            targetInfo.existedOrigin,
            parentWindow
          );

          return false;
        }

        return true;
      }
    );
  },
};
