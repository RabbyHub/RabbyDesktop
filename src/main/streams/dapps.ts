import { getAppProxyConf } from '../store/desktopApp';
import { createPopupWindow } from '../utils/browser';
import { parseWebsiteFavicon } from '../utils/fetch';
import { handleIpcMainInvoke } from '../utils/ipcMainEvents';

handleIpcMainInvoke('parse-favicon', async (_, targetURL) => {
  const result = {
    error: null,
    favicon: null as IParsedFavicon | null,
  };
  try {
    const proxyConf = getAppProxyConf();
    const proxyOnParseFavicon =
      proxyConf.proxyType === 'custom'
        ? {
            protocol: proxyConf.proxySettings.protocol,
            host: proxyConf.proxySettings.hostname,
            port: proxyConf.proxySettings.port,
          }
        : undefined;

    result.favicon = await parseWebsiteFavicon(targetURL, {
      timeout: 3000,
      proxy: proxyOnParseFavicon,
    });
  } catch (e: any) {
    result.error = e.message;
  }

  return result;
});

// create popup window with 1366 * 768 size, and capature it
handleIpcMainInvoke('preview-dapp', async (_, targetURL) => {
  const previewWindow = createPopupWindow({
    width: 1366,
    height: 768,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: false,
    },
  });

  previewWindow.loadURL(targetURL);

  const p = new Promise<string | null>((resolve, reject) => {
    let timeouted = false;

    setTimeout(() => {
      timeouted = true;
      reject(new Error('timeout'));
    }, 8 * 1e3);

    previewWindow.webContents.on('did-fail-load', () => {
      reject();
    });

    previewWindow.webContents.on('certificate-error', () => {
      reject();
    });

    previewWindow.webContents.on('did-finish-load', () => {
      previewWindow.webContents.capturePage().then((image: any) => {
        if (timeouted) return;
        const screenshot = image.toDataURL();
        resolve(screenshot);
      });
    });
  });

  let previewImg: string | null = null;
  let error: string | null = null;
  try {
    previewImg = await p;
  } catch (e: any) {
    if (e?.message === 'timeout') {
      error = 'Preview timeout';
    } else {
      error = 'Error occured on Preview dapp';
    }
    previewImg = null;
  } finally {
    previewWindow.close();
    previewWindow.destroy();
  }

  return {
    error,
    previewImg,
  };
});
