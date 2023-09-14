import { SAFE_WEBPREFERENCES } from '../isomorphic/constants';
import { ipcRendererObj } from './base';
import { stringifyWebPreferences } from '../isomorphic/string';
import {
  getWebviewTagsPark,
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
    }

    // tagsPark.style.display = 'none';
    toggleShowElement(tagsPark, true);
    tagsPark.setAttribute('data-creation', '2');

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
      webviewTag.setAttribute('r-related-dappid', payload.relatedDappId ?? '');
      // webviewTag.setAttribute('session', 'persit:default');

      // webviewTag.setAttribute('autosize', 'true');
      webviewTag.style.display = 'none';

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
      const openSrc = payload.additionalData.blankPage;

      // TODO: maybe sometimes we can open relatedDappId directly?
      webviewTag.src = openSrc;
      webviewTag.setAttribute('src', openSrc);

      getWebviewTagsPark().appendChild(webviewTag);

      webviewTag.addEventListener('dom-ready', () => {
        const iframeEle = webviewTag.shadowRoot?.querySelector('iframe');
        if (iframeEle) {
          iframeEle.style.height = '100%';
        }

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
      });
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
