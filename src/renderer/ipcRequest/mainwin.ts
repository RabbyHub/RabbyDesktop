export async function toggleMainWinTabAnimating(
  payload: ChannelInvokePayload['toggle-activetab-animating']['send'][0]
) {
  return window.rabbyDesktop.ipcRenderer.invoke(
    'toggle-activetab-animating',
    payload
  );
}

export function closeTabFromInternalPage(
  tabId: Exclude<chrome.tabs.Tab['id'], void>
) {
  window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_forward:main-window:close-tab',
    tabId
  );
}

export function closeAllTabs() {
  window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_forward:main-window:close-all-tab'
  );
}

export function openDappFromInternalPage(origin: IDapp['origin']) {
  window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_forward:main-window:create-dapp-tab',
    origin
  );
}

export function makeSureDappOpened(origin: IDapp['origin']) {
  window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_rpc:mainwindow:make-sure-dapp-opened',
    origin
  );
}
