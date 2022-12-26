export function showMainwinPopup(
  rect: { x: number; y: number; width?: number; height?: number },
  pageInfo: IContextMenuPageInfo
) {
  return window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_rpc:popupwin-on-mainwin:toggle-show',
    {
      nextShow: true,
      rect,
      type: pageInfo.type,
      pageInfo,
    }
  );
}

export function hideMainwinPopup(type: IContextMenuPageInfo['type']) {
  return window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_rpc:popupwin-on-mainwin:toggle-show',
    {
      nextShow: false,
      type,
    }
  );
}
