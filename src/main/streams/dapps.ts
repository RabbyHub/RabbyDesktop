import { parseWebsiteFavicon } from '../utils/fetch';
import { handleIpcMainInvoke } from '../utils/ipcMainEvents';

handleIpcMainInvoke('parse-favicon', async (_, targetURL) => {
  const result = {
    error: null,
    favicon: null as IParsedFavicon | null,
  };
  try {
    result.favicon = await parseWebsiteFavicon(targetURL);
  } catch (e: any) {
    result.error = e.message;
  }

  return result;
});
