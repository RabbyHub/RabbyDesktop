import { checkProxyViaBrowserView } from '../utils/appNetwork';
import { handleIpcMainInvoke } from '../utils/ipcMainEvents';

handleIpcMainInvoke('check-proxyConfig', async (evt, payload) => {
  let valid = false;
  let errMsg = '';

  try {
    const result = await checkProxyViaBrowserView(
      payload.detectURL,
      payload.proxyConfig
    );
    if (result.valid) {
      valid = true;
    } else {
      valid = false;
      errMsg = result.errorDesc || result.certErrorDesc || 'Unknown Reason';
    }
  } catch (e) {
    errMsg = (e as any).message;
    valid = false;
  }

  return { valid, errMsg };
});
