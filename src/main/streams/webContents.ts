import { getBaseHref } from '@/isomorphic/url';
import { shell } from 'electron';
import { EnumOpenDappAction } from '@/isomorphic/constants';
import TabbedBrowserWindow, {
  MainTabbedBrowserWindow,
} from '../browser/browsers';
import { getAllDapps, parseDappRedirect } from '../store/dapps';
import { switchToBrowserTab } from '../utils/browser';
import { safeOpenURL } from './dappSafeview';
import {
  checkoutTabbedWindow,
  getOrCreateDappBoundTab,
} from '../utils/tabbedBrowserWindow';
import { getBlockchainExplorers } from '../store/dynamicConfig';
import { onMainWindowReady } from '../utils/stream-helpers';

/**
 * @deprecated
 */
export async function openTabOfDapp(
  mainTabbedWin: MainTabbedBrowserWindow,
  url: string
) {
  // find if opened tab already
  const { finalTab: continualOpenedTab } = await getOrCreateDappBoundTab(
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

    const {
      targetInfo,
      isFromDapp,
      isToExtension,
      isToSameOrigin,
      couldKeepTab,
      allowOpenTab,
      shouldOpenExternal,
      maybeRedirectInSPA,
    } = parseDappRedirect(currentUrl, targetURL, {
      dapps,
      blockchain_explorers: getBlockchainExplorers(),
      isForTrezorLikeConnection,
    });

    if (shouldOpenExternal) {
      shell.openExternal(targetURL);
      return { action: 'deny' };
    }

    if (isFromDapp && !isToSameOrigin) {
      if (!couldKeepTab || allowOpenTab) {
        safeOpenURL(targetURL, {
          sourceURL: currentUrl,
          targetMatchedDappResult: targetInfo.matchDappResult,
          httpTargetMatchedDappResult: targetInfo.matchDappResultForHttp,
          _targetwin: parentTabbedWin.window,
        }).then((res) => res.activeTab());
      } else {
        webContents.loadURL(targetURL);
      }
    } else if (!isToExtension) {
      switch (details.disposition) {
        case 'foreground-tab':
        case 'background-tab':
        case 'new-window': {
          const openedDapp =
            parentTabbedWin?.tabs.findBySecondaryDomain(targetURL);
          if (openedDapp) {
            switchToBrowserTab(openedDapp!._id, parentTabbedWin!);

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
            onMainWindowReady().then(async (mainTabbedWin) => {
              const { finalTab } = await getOrCreateDappBoundTab(
                mainTabbedWin,
                targetURL
              );
              finalTab?.loadURL(targetURL);
            });
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
    webContents.on('will-redirect', (evt, targetURL, isInPlace) => {
      if (!webContents) return;
      const evtWebContents = (evt as any).sender as Electron.WebContents;
      const dapps = getAllDapps();

      const { tabbedWindow, foundTab, matchedDappInfo } = checkoutTabbedWindow(
        evtWebContents,
        dapps
      );
      const previousURL = matchedDappInfo?.dapp?.origin || '';

      const { targetInfo, finalAction } = parseDappRedirect(
        previousURL,
        targetURL,
        {
          dapps,
          blockchain_explorers: getBlockchainExplorers(),
          isForTrezorLikeConnection: tabbedWindow?.isForTrezorLikeConnection(),
          isFromExistedTab: !!foundTab,
          isServerSideRedirect: true,
        }
      );

      switch (finalAction) {
        case EnumOpenDappAction.deny: {
          if (!!foundTab && !!targetInfo.existedDapp) {
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
        case EnumOpenDappAction.safeOpenOrSwitchToAnotherTab: {
          safeOpenURL(targetURL, {
            targetMatchedDappResult: targetInfo.matchDappResult,
            httpTargetMatchedDappResult: targetInfo.matchDappResultForHttp,
            sourceURL: previousURL,
            redirectSourceTab: foundTab,
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
        const { tabbedWindow, foundTab } = checkoutTabbedWindow(
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
          isFromExistedTab: !!foundTab,
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
          case EnumOpenDappAction.safeOpenOrSwitchToAnotherTab: {
            evt.preventDefault();

            safeOpenURL(targetURL, {
              sourceURL: currentUrl,
              targetMatchedDappResult: targetInfo.matchDappResult,
              httpTargetMatchedDappResult: targetInfo.matchDappResultForHttp,
              // openedTab,
              _targetwin: parentWindow,
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
