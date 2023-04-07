import { emitIpcMainEvent } from './ipcMainEvents';

export function notifyShowFindInPage(
  tabOrigin: { x: number; y: number },
  tabId: number
) {
  // notify search window to show
  emitIpcMainEvent('__internal_main:popupview-on-mainwin:toggle-show', {
    type: 'in-dapp-find',
    nextShow: true,
    pageInfo: {
      type: 'in-dapp-find',
      searchInfo: {
        tabId,
        tabOrigin,
      },
    },
  });
}

export function notifyHideFindInPage() {
  emitIpcMainEvent('__internal_main:popupview-on-mainwin:toggle-show', {
    type: 'in-dapp-find',
    nextShow: false,
  });
}

export function notifyHidePopupWindowOnMain(type: IPopupWinPageInfo['type']) {
  emitIpcMainEvent('__internal_main:popupwin-on-mainwin:toggle-show', {
    type,
    nextShow: false,
  });
}
