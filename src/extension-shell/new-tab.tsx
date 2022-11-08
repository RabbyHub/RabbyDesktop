/// <reference path="../renderer/preload.d.ts" />

window.rabbyDesktop.ipcRenderer.on('rabby-extension-id', function (event) {
  const anchor = document.querySelector(
    '#rabby-item > a'
  )! as HTMLAnchorElement;

  const extId = event.rabbyExtensionId;
  anchor.href = `chrome-extension://${extId}/background.html`;
  anchor.innerHTML = `chrome-extension://${extId}/background.html`;
});

window.rabbyDesktop.ipcRenderer.sendMessage('rabby-extension-id');
