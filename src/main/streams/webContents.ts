import { getBaseHref } from '@/isomorphic/url';
import { shell } from 'electron';
import { EnumOpenDappAction } from '@/isomorphic/constants';
import TabbedBrowserWindow, {
  MainTabbedBrowserWindow,
} from '../browser/browsers';
import { getAllDapps, parseDappRedirect } from '../store/dapps';
import { safeOpenURL } from './dappSafeview';
import {
  checkoutTabbedWindow,
  getOrCreateDappByURL,
} from '../utils/tabbedBrowserWindow';
import { getBlockchainExplorers } from '../store/dynamicConfig';

/**
 * @deprecated
 */
export function openTabOfDapp(
  mainTabbedWin: MainTabbedBrowserWindow,
  url: string
) {
  // find if opened tab already
  const { finalTab: continualOpenedTab } = getOrCreateDappByURL(
    mainTabbedWin,
    url
  );
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
  const isForTrezorLikeConnection = parentTabbedWin.isForTrezorLikeConnection();

  webContents.setWindowOpenHandler((details) => {
    if (!webContents) return { action: 'deny' };

    const currentUrl = webContents.getURL();
    const dapps = getAllDapps();

    const targetURL = details.url;

    const { tabbedWindow, webContentsDappTab } = checkoutTabbedWindow(
      webContents,
      dapps
    );

    const { targetInfo, finalAction, maybeRedirectInSPA } = parseDappRedirect(
      currentUrl,
      targetURL,
      {
        dapps,
        blockchain_explorers: getBlockchainExplorers(),
        webContentsDappTab,
        isForTrezorLikeConnection,
        isOpenNewTab: true,
      }
    );

    switch (finalAction) {
      case EnumOpenDappAction.deny: {
        return { action: 'deny' };
      }
      case EnumOpenDappAction.openExternal: {
        shell.openExternal(targetURL);
        return { action: 'deny' };
      }
      case EnumOpenDappAction.leaveInTab: {
        if (maybeRedirectInSPA) {
          setTimeout(() => {
            if (webContents.isDestroyed()) return;

            if (getBaseHref(webContents.getURL()) !== getBaseHref(targetURL)) {
              webContents.loadURL(targetURL);
            }
          }, 200);
        } else {
          // TODO: is here correct?
          webContents.loadURL(targetURL);
        }
        return { action: 'deny' };
      }
      case EnumOpenDappAction.safeCreateOrSwitchToAnotherTab: {
        safeOpenURL(targetURL, {
          targetMatchedDappResult: targetInfo.matchDappResult,
          sourceURL: currentUrl,
          targetWindow: tabbedWindow?.window,
        }).then((res) => res.activeTab());

        break;
      }
      default: {
        break;
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
    webContents.on('will-redirect', (evt, targetURL, isInPlace) => {
      if (!webContents) return;
      const evtWebContents = (evt as any).sender as Electron.WebContents;
      const dapps = getAllDapps();

      const { tabbedWindow, webContentsDappTab, matchedDappInfo } =
        checkoutTabbedWindow(evtWebContents, dapps);
      const previousURL = matchedDappInfo?.dapp?.origin || '';

      const { targetInfo, finalAction } = parseDappRedirect(
        previousURL,
        targetURL,
        {
          dapps,
          blockchain_explorers: getBlockchainExplorers(),
          isForTrezorLikeConnection: tabbedWindow?.isForTrezorLikeConnection(),
          webContentsDappTab,
          isServerSideRedirect: true,
        }
      );

      switch (finalAction) {
        case EnumOpenDappAction.deny: {
          if (!!webContentsDappTab && !!targetInfo.existedDapp) {
            // TODO: maybe we should open dapp from tab belongs to the dapp?
            return true;
          }
          evt.preventDefault();
          return false;
        }
        case EnumOpenDappAction.openExternal: {
          shell.openExternal(targetURL);
          evt.preventDefault();
          return false;
        }
        case EnumOpenDappAction.leaveInTab: {
          return true;
        }
        case EnumOpenDappAction.safeCreateOrSwitchToAnotherTab: {
          safeOpenURL(targetURL, {
            targetMatchedDappResult: targetInfo.matchDappResult,
            sourceURL: previousURL,
            serverSideRedirectSourceTab: webContentsDappTab,
          }).then((res) => res.activeTab());

          evt.preventDefault();
          return false;
        }
        default: {
          evt.preventDefault();
          return false;
        }
      }

      evt.preventDefault();
      return false;
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

        const dapps = getAllDapps();
        const { tabbedWindow, webContentsDappTab } = checkoutTabbedWindow(
          evtWebContents,
          dapps
        );

        const {
          targetInfo,
          // actually, it's always from dapp on isMainContentsForTabbedWindow=false
          finalAction,
        } = parseDappRedirect(currentUrl, targetURL, {
          dapps,
          blockchain_explorers: getBlockchainExplorers(),
          isForTrezorLikeConnection: tabbedWindow?.isForTrezorLikeConnection(),
          webContentsDappTab,
        });

        switch (finalAction) {
          case EnumOpenDappAction.deny: {
            return false;
          }
          case EnumOpenDappAction.openExternal: {
            shell.openExternal(targetURL);
            return false;
          }
          case EnumOpenDappAction.leaveInTab: {
            return true;
          }
          case EnumOpenDappAction.safeCreateOrSwitchToAnotherTab: {
            evt.preventDefault();
            safeOpenURL(targetURL, {
              sourceURL: currentUrl,
              targetMatchedDappResult: targetInfo.matchDappResult,
              targetWindow: parentWindow,
            }).then((res) => res.activeTab());

            return false;
          }
          default: {
            evt.preventDefault();
            return false;
          }
        }

        return false;
      }
    );
  },
};
