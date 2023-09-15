import { SAFE_WEBPREFERENCES } from '../isomorphic/constants';
import { ipcRendererObj } from './base';
import { stringifyWebPreferences } from '../isomorphic/string';
import {
  getWebviewTagsPark,
  queryAllTabWebviewTags,
  queryTabWebviewTag,
  toggleShowElement,
} from '../isomorphic/dom-helpers';

/**
 * @description default tabs creation/update/remove solution for window shell
 */
export function setupWindowShell() {
  document.addEventListener('DOMContentLoaded', () => {
    let tagsPark = getWebviewTagsPark();
    if (!tagsPark) {
      tagsPark = document.createElement('div');
      tagsPark.setAttribute('data-creation', '2');
    }

    toggleShowElement(tagsPark, true);

    tagsPark.id = 'webview-tags';
    document.body.appendChild(tagsPark);
  });

  ipcRendererObj.on(
    '__internal_push:tabbed-window2:create-webview',
    (payload) => {
      const webviewTag =
        queryTabWebviewTag(payload) ||
        (document.createElement('webview') as Electron.WebviewTag);
      webviewTag.setAttribute('r-tab-uid', payload.tabUid);
      webviewTag.setAttribute('r-for-windowid', `${payload.windowId}`);

      /**
       * we should enable that to allow webview can trigger events about
       * 'will-redirect'/'will-navigate'/openHandlers in main process
       */
      webviewTag.setAttribute('allowpopups', 'true');

      toggleShowElement(webviewTag, false);

      webviewTag.setAttribute(
        'webpreferences',
        stringifyWebPreferences({
          ...SAFE_WEBPREFERENCES,
          safeDialogs: true,
          safeDialogsMessage: 'Stop consecutive dialogs',
          preload: payload.additionalData.preloadPath,
          webviewTag: false,
        })
      );

      // const openSrc = payload.relatedDappId ?? payload.additionalData.blankPage;

      // init open blank page to fast trigger chrome.tabs.onUpdated
      // let openSrc = payload.additionalData.blankPage;
      let openSrc = 'about:blank';
      if (
        payload.tabMeta.webuiType !== 'MainWindow' &&
        payload.tabMeta.initDetails?.url
      ) {
        openSrc = payload.tabMeta.initDetails.url;
      }
      // TODO: maybe sometimes we can open relatedDappId directly?
      webviewTag.setAttribute('src', openSrc);

      webviewTag.addEventListener('dom-ready', () => {
        const cEvent = new CustomEvent<WebviewTagExchgMatches>(
          'webviewTagCreated',
          {
            detail: {
              tabUid: payload.tabUid,
              windowId: payload.windowId,
            },
          }
        );

        document.dispatchEvent(cEvent);

        const iframeEle = webviewTag.shadowRoot?.querySelector('iframe');
        if (iframeEle) {
          iframeEle.style.height = '100%';
        }
      });

      getWebviewTagsPark().appendChild(webviewTag);
    }
  );

  ipcRendererObj.on(
    '__internal_push:tabbed-window2:show-webview',
    (payload) => {
      const { webviewTag, allWebviews } = queryAllTabWebviewTags(payload);

      if (!webviewTag) return;

      allWebviews.forEach((node) => {
        toggleShowElement(node, false);
      });
      toggleShowElement(webviewTag, true);

      if (!payload.isDappWebview) {
        webviewTag.style.left = `${payload.viewBounds.x}px`;
        webviewTag.style.top = `${payload.viewBounds.y}px`;
        webviewTag.style.width = `${payload.viewBounds.width}px`;
        webviewTag.style.height = `${payload.viewBounds.height}px`;
      }
    }
  );

  ipcRendererObj.on(
    '__internal_push:tabbed-window2:hide-webview',
    (payload) => {
      const webviewTag = queryTabWebviewTag(payload);

      if (!webviewTag) return;

      toggleShowElement(webviewTag, false);
    }
  );

  ipcRendererObj.on(
    '__internal_push:tabbed-window2:destroy-webview',
    (payload) => {
      const webviewTag = queryTabWebviewTag(payload);

      if (!webviewTag) return;

      try {
        webviewTag.remove();
      } catch (error) {
        console.error(error);
      }
    }
  );
}
