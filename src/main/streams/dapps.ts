import { Blob } from 'buffer';

import { getAppProxyConf } from '../store/desktopApp';
import { createPopupWindow } from '../utils/browser';
import { safeCapturePage } from '../utils/dapps';
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
  const result = await safeCapturePage(targetURL);

  return {
    error: result.error,
    previewImg: result.previewImg,
  };
});
