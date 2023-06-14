import { handleIpcMainInvoke } from '../utils/ipcMainEvents';
import { getSystemReleaseInfo } from '../utils/os';

// onMainWindowReady().then(async () => {
//   const { views } = await getAllMainUIViews();

//   if (!IS_RUNTIME_PRODUCTION) {
//     views["z-popup"].webContents.openDevTools({ mode: "detach" });
//   }

//   sendToWebContents(views["z-popup"].webContents, '__internal_push:z-popup:system-release-info', {
//     systemReleaseInfo: getSystemReleaseInfo(),
//   });
// });

handleIpcMainInvoke('get-system-release-info', () => {
  return {
    systemReleaseInfo: getSystemReleaseInfo(),
  };
});
