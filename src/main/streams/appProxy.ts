import { coerceInteger } from '@/isomorphic/primitive';
import { desktopAppStore, getFullAppProxyConf } from '../store/desktopApp';
import { checkProxyViaBrowserView } from '../utils/appNetwork';
import { emitIpcMainEvent, handleIpcMainInvoke } from '../utils/ipcMainEvents';
import { getAppRuntimeProxyConf } from '../utils/stream-helpers';

handleIpcMainInvoke('check-proxyConfig', async (evt, payload) => {
  let valid = false;
  let errMsg = '';

  try {
    const result = await checkProxyViaBrowserView(payload.detectURL, {
      proxyType: 'custom',
      proxySettings: payload.proxyConfig,
    });

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

handleIpcMainInvoke('get-proxyConfig', async (_) => {
  const appProxyInfo = await getFullAppProxyConf({
    refetchSystemProxyServer: true,
  });

  return {
    systemProxy: appProxyInfo.systemProxySettings,
    runtime: await getAppRuntimeProxyConf(),
  };
});

handleIpcMainInvoke('apply-proxyConfig', async (evt, conf) => {
  // TODO: check input data
  desktopAppStore.set('proxyType', conf.proxyType);
  conf.proxySettings.port = coerceInteger(conf.proxySettings.port, 80);
  desktopAppStore.set('proxySettings', conf.proxySettings);

  emitIpcMainEvent('__internal_main:app:relaunch');
});
