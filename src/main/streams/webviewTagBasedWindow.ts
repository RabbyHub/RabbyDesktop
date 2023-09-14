import { WebviewTagBasedViewOb$s } from '../browser/tabs';
import { handleIpcMainInvoke } from '../utils/ipcMainEvents';

handleIpcMainInvoke(
  '__internal_rpc:tabbed-window2:created-webview',
  (evt, payload) => {
    WebviewTagBasedViewOb$s.createdWebview.next({
      webContentsId: evt.sender.id,
      windowWebContentsId: evt.sender.id,
      payload,
    });
  }
);
