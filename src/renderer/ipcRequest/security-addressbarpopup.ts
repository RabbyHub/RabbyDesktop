/**
 * @deprecated
 */
export function openDappAddressbarSecurityPopupView(dappUrl: string) {
  window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_rpc:security-addressbarpopup:request-show',
    dappUrl
  );
}
/**
 * @deprecated
 */
export function hideDappAddressbarSecurityPopupView() {
  window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_rpc:security-addressbarpopup:hide'
  );
}
