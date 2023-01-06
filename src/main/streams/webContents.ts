import { formatDapps } from '@/isomorphic/dapp';
import { getBaseHref, isUrlFromDapp } from '@/isomorphic/url';
import TabbedBrowserWindow from '../browser/browsers';
import { dappStore, parseDappUrl } from '../store/dapps';
import { switchToBrowserTab } from '../utils/browser';
import { attachDappSafeview } from './dappSafeview';

export function createDappTab(mainTabbedWin: TabbedBrowserWindow, url: string) {
  const continualOpenedTab = mainTabbedWin.createTab({
    initDetails: { url },
  });
  continualOpenedTab?.loadURL(url);

  // const closeOpenedTab = () => {
  //   continualOpenedTab?.destroy();
  // };

  // openDappSecurityCheckView(url, mainTabbedWin.window).then(
  //   ({ continualOpId }) => {
  //     // TODO: use timeout mechanism to avoid memory leak
  //     const dispose = onIpcMainEvent(
  //       '__internal_rpc:security-check:continue-close-dapp',
  //       (_evt, _openId) => {
  //         if (mainTabbedWin.window && _openId === continualOpId) {
  //           dispose?.();
  //           closeOpenedTab();
  //         }
  //       }
  //     );
  //   }
  // );
}

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
    const isFromDapp = isUrlFromDapp(currentUrl);
    const dapps = formatDapps(dappStore.get('dapps'));

    const targetURL = details.url;
    const currentInfo = parseDappUrl(currentUrl, dapps);
    const targetInfo = parseDappUrl(targetURL, dapps);
    const toSameOrigin = currentInfo.origin === targetInfo.origin;
    const maybeRedirectInSPA = isFromDapp && toSameOrigin;

    const isToExt = targetURL.startsWith('chrome-extension://');

    if (isFromDapp && !toSameOrigin) {
      attachDappSafeview(
        targetURL,
        targetInfo.existedOrigin,
        parentTabbedWin.window
      );
    } else if (!isToExt) {
      switch (details.disposition) {
        case 'foreground-tab':
        case 'background-tab':
        case 'new-window': {
          const openedDapp = parentTabbedWin?.tabs.findByOrigin(targetURL);
          if (openedDapp) {
            switchToBrowserTab(openedDapp!.id, parentTabbedWin!);

            /**
             * sometimes, targetURL has same origin with currentUrl.
             *
             * for SPA, we don't set new url for it.
             * But for static redirect url, we need to set new url.
             */
            if (maybeRedirectInSPA) {
              setTimeout(() => {
                if (webContents.isDestroyed()) return;

                if (
                  getBaseHref(webContents.getURL()) !== getBaseHref(targetURL)
                ) {
                  webContents.loadURL(targetURL);
                }
              }, 200);
            }
          } else {
            createDappTab(parentTabbedWin, targetURL);
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
      const evtWebContents = (evt as any).sender as Electron.WebContents;
      const currentUrl = evtWebContents.getURL();
      const isFromDapp = isUrlFromDapp(currentUrl);

      const dapps = formatDapps(dappStore.get('dapps'));

      const currentInfo = parseDappUrl(currentUrl, dapps);
      const targetInfo = parseDappUrl(targetURL, dapps);
      const toSameOrigin = currentInfo.origin === targetInfo.origin;

      // this tabs is render as app's self UI, such as topbar.
      if (isFromDapp && !toSameOrigin) {
        evt.preventDefault();
        attachDappSafeview(targetURL);

        return false;
      }

      return true;
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
        const toSameOrigin = currentInfo.origin === targetInfo.origin;

        if (isFromDapp && !toSameOrigin) {
          evt.preventDefault();
          attachDappSafeview(targetURL, targetInfo.existedOrigin, parentWindow);

          return false;
        }

        return true;
      }
    );
  },
};
