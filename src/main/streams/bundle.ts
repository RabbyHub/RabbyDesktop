import {
  onIpcMainInternalEvent,
  sendToWebContents,
} from '@/main/utils/ipcMainEvents';
import {
  getAllMainUIViews,
  getAllMainUIWindows,
} from '@/main/utils/stream-helpers';

onIpcMainInternalEvent(
  '__internal_main:bundle:changed',
  async ({ accounts }) => {
    const [{ windowList }, { viewOnlyList }] = await Promise.all([
      getAllMainUIWindows(),
      getAllMainUIViews(),
    ]);

    const viewSet = new Set([
      ...windowList.map((win) => win.webContents),
      ...viewOnlyList.map((view) => view),
    ]);

    viewSet.forEach((webContents) => {
      sendToWebContents(webContents, '__internal_push:bundle:changed', {
        accounts,
      });
    });
  }
);
