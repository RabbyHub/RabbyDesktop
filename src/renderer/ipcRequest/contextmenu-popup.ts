export function showContextMenuPopup(
  rect: { x: number; y: number; width?: number; height?: number },
  pageInfo: IContextMenuPageInfo
) {
  return window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_rpc:context-menu-popup:toggle-show',
    {
      nextShow: true,
      rect,
      type: pageInfo.type,
      pageInfo,
    }
  );
}

export function hideContextMenuPopup(type: IContextMenuPageInfo['type']) {
  return window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_rpc:context-menu-popup:toggle-show',
    {
      nextShow: false,
      type,
    }
  );
}
