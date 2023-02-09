export function showMainwinPopup(
  rect: { x: number; y: number; width?: number; height?: number },
  pageInfo: IPopupWinPageInfo,
  opts?: {
    openDevTools?: boolean;
  }
) {
  return window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_rpc:popupwin-on-mainwin:toggle-show',
    {
      nextShow: true,
      rect,
      type: pageInfo.type,
      pageInfo,
      openDevTools: opts?.openDevTools,
    }
  );
}

export function hideMainwinPopup(type: IPopupWinPageInfo['type']) {
  return window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_rpc:popupwin-on-mainwin:toggle-show',
    {
      nextShow: false,
      type,
    }
  );
}
