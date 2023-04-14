export function openExternalUrl(url: string) {
  window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_rpc:app:open-external-url',
    url
  );
}

export function requestResetApp() {
  window.rabbyDesktop.ipcRenderer.sendMessage('__internal_rpc:app:reset-app');
}

export function validateProxyConfig(
  url: string,
  proxyConfig: IAppProxyConf['proxySettings']
) {
  return window.rabbyDesktop.ipcRenderer.invoke('check-proxyConfig', {
    detectURL: url,
    proxyConfig,
  });
}

export function getReleaseNoteByVersion(version?: string) {
  return window.rabbyDesktop.ipcRenderer.invoke('get-release-note', version);
}
