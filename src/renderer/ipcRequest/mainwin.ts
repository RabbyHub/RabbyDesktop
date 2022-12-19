export function closeTabFromInternalPage(
  tabId: Exclude<chrome.tabs.Tab['id'], void>
) {
  window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_forward:main-window:close-tab',
    tabId
  );
}
