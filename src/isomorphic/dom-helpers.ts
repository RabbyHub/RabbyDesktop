let globalWebviewTagsParkEl: HTMLDivElement | null = null;
export function getWebviewTagsPark() {
  if (!globalWebviewTagsParkEl) {
    globalWebviewTagsParkEl = document.body.querySelector(
      '#webview-tags'
    )! as HTMLDivElement;
  }

  const appWebviewTagsParkEl = document.body.querySelector(
    '#app-webview-tags'
  ) as HTMLDivElement | null;

  return appWebviewTagsParkEl ?? globalWebviewTagsParkEl;
}

export function queryTabWebviewTag(
  matches: Omit<WebviewTagExchgMatches, 'windowId'> & {
    windowId?: number;
  }
) {
  return document.body.querySelector(
    [
      `webview[r-tab-uid="${matches.tabUid}"]`,
      !matches.windowId ? '' : `[r-for-windowid="${matches.windowId}"]`,
    ].join('')
  ) as Electron.WebviewTag | null;
}

export function queryAllTabWebviewTags(matches?: WebviewTagExchgMatches) {
  const allNodes = getWebviewTagsPark().querySelectorAll(
    `webview[r-tab-uid][r-for-windowid]`
  ) as NodeListOf<Electron.WebviewTag>;

  return {
    allWebviews: allNodes,
    webviewTag:
      !matches || !allNodes
        ? null
        : (Array.from(allNodes).find((node) => {
            return (
              node.getAttribute('r-tab-uid') === matches.tabUid &&
              node.getAttribute('r-for-windowid') === `${matches.windowId}`
            );
          }) as Electron.WebviewTag | null),
  };
}

export function toggleShowElement(
  webviewTag?: HTMLElement,
  nextShow: string | boolean = webviewTag?.style.display === 'none'
) {
  if (!webviewTag) return;

  if (nextShow) {
    webviewTag.style.display = 'block';
  } else {
    webviewTag.style.display = 'none';
  }
}
