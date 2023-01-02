export function openExternalUrl(url: string) {
  window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_rpc:app:open-external-url',
    url
  );
}
