/**
 * @notice make sure import this file to all shell page's entry
 */

import { queryTabWebviewTag } from '@/isomorphic/dom-helpers';

// const webviewTagPools: Electron.WebviewTag[] = [];

const listener = (event: CustomEvent<WebviewTagCreatedEventPayload>) => {
  const detail = event.detail;
  const webviewTag = queryTabWebviewTag(detail);

  if (!webviewTag) {
    console.error(
      `[listener] cannot find webview tag with uid ${detail.tabUid}`
    );
    return;
  }

  if (detail.needClearHistory) {
    webviewTag?.clearHistory();
  }

  window.rabbyDesktop.ipcRenderer.invoke(
    '__internal_rpc:tabbed-window2:created-webview',
    {
      tabUid: detail.tabUid,
      windowId: detail.windowId,
      tabWebContentsId: webviewTag.getWebContentsId(),
    }
  );
};

// @ts-expect-error
document.addEventListener('webviewTagCreated', listener);
