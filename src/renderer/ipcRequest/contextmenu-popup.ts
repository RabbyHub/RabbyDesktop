export function showContextMenuPopup(
  position: { x: number; y: number },
  pageInfo: IContextMenuPageInfo
) {
  return window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_rpc:context-meunu-popup:toggle-show',
    {
      nextShow: true,
      pos: position,
      type: pageInfo.type,
      pageInfo,
    }
  );
}

export function hideContextMenuPopup(type: IContextMenuPageInfo['type']) {
  return window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_rpc:context-meunu-popup:toggle-show',
    {
      nextShow: false,
      type,
    }
  );
}
