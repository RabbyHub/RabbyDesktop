export function showMainwinPopupview(
  pageInfo: PopupViewOnMainwinInfo,
  opts?: {
    openDevTools?: boolean;
  }
) {
  return window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_rpc:popupview-on-mainwin:toggle-show',
    {
      nextShow: true,
      type: pageInfo.type,
      pageInfo,
      openDevTools: opts?.openDevTools,
    }
  );
}

export function hideMainwinPopupview(
  type: PopupViewOnMainwinInfo['type'],
  opts?: {
    reloadView?: boolean;
  }
) {
  window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_rpc:popupview-on-mainwin:toggle-show',
    {
      nextShow: false,
      type,
    }
  );

  if (opts?.reloadView) {
    setTimeout(() => {
      window.location.reload();
    }, 200);
  }
}
