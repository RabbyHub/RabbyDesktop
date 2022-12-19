export function showContextMenuPopup(position: { x: number; y: number }) {
  return window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_rpc:context-meunu-popup:toggle-show',
    {
      nextShow: true,
      pos: position,
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
