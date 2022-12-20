export function showContextMenuPopup(
  position: { x: number; y: number },
  pageInfo: IContextMenuPageInfo
) {
  return window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_rpc:context-meunu-popup:toggle-show',
    {
      nextShow: true,
      pos: position,
      pageInfo,
    }
  );
}

export function hideContextMenuPopup() {
  return window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_rpc:context-meunu-popup:toggle-show',
    {
      nextShow: false,
    }
  );
}

export function sendMessageToContextMenuPopup<T extends object = any>(msg: T) {
  return window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_rpc:context-meunu-popup:send-message',
    {
      msg,
    }
  );
}
