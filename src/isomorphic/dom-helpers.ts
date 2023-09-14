let webviewTagsParkEl: HTMLDivElement | null = null;
export function getWebviewTagsPark() {
  if (!webviewTagsParkEl) {
    webviewTagsParkEl = document.body.querySelector(
      '#webview-tags'
    )! as HTMLDivElement;
  }
  return webviewTagsParkEl;
}

export function queryTabWebviewTag(matches: WebviewTagExchgMatches) {
  return document.body.querySelector(
    `webview[r-tab-uid="${matches.tabUid}"][r-for-windowid="${matches.windowId}"]`
  ) as Electron.WebviewTag | null;
}

export function toggleShowElement(
  webviewTag?: HTMLElement,
  nextShow: string | boolean = webviewTag?.style.display === 'none'
) {
  if (!webviewTag) {
    return;
  }

  if (nextShow) {
    webviewTag.style.display = 'block';
  } else {
    webviewTag.style.display = 'none';
  }
}
