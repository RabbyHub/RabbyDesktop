export function openDappAddressbarSecurityPopupView(url: string) {
  window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_rpc:security-addressbarpopup:show',
    url
  );
}

export function hideDappAddressbarSecurityPopupView() {
  window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_rpc:security-addressbarpopup:hide'
  );
}
