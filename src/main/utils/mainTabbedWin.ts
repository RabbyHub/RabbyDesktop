import { emitIpcMainEvent } from './ipcMainEvents';

export function notifyStartFindInPage(
  pos: { x: number; y: number },
  tabId: number
) {
  // notify search window to show
  emitIpcMainEvent('__internal_main:popupwin-on-mainwin:toggle-show', {
    type: 'in-dapp-find',
    nextShow: true,
    rect: {
      x: pos.x,
      y: pos.y,
    },
    pageInfo: {
      type: 'in-dapp-find',
      searchInfo: {
        id: tabId,
      },
    },
  });
}

export function notifyStopFindInPage() {
  emitIpcMainEvent('__internal_main:popupwin-on-mainwin:toggle-show', {
    type: 'in-dapp-find',
    nextShow: false,
  });
}
