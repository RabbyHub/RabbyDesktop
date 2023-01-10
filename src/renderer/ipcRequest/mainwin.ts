import { randString } from '@/isomorphic/string';

export function toggleLoadingView(
  payload: ChannelMessagePayload['__internal_rpc:mainwindow:toggle-loading-view']['send'][0]
) {
  window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_rpc:mainwindow:toggle-loading-view',
    payload
  );
}

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

export function openDappFromInternalPage(origin: IDapp['origin']) {
  window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_forward:main-window:open-dapp',
    origin
  );
}

export function getNavInfoByTabId(tabId: Exclude<chrome.tabs.Tab['id'], void>) {
  const reqid = randString();

  // TODO: use timeout mechanism
  return new Promise<IShellNavInfo>((resolve, reject) => {
    const dispose = window.rabbyDesktop.ipcRenderer.on(
      '__internal_rpc:webui-ext:navinfo',
      (event) => {
        if (event.reqid === reqid) {
          resolve(event.tabNavInfo);
          dispose?.();
        }
      }
    );
    window.rabbyDesktop.ipcRenderer.sendMessage(
      '__internal_rpc:webui-ext:navinfo',
      reqid,
      tabId
    );
  });
}

export function makeSureDappOpened(origin: IDapp['origin']) {
  window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_rpc:mainwindow:make-sure-dapp-opened',
    origin
  );
}
