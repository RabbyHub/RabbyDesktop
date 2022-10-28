export function openDappAddressbarSecurityPopupView(dappUrl: string) {
  window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_rpc:security-addressbarpopup:show',
    dappUrl
  );
}

export function hideDappAddressbarSecurityPopupView() {
  window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_rpc:security-addressbarpopup:hide'
  );
}
