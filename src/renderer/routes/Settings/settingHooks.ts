import { useCallback, useState } from 'react';
import { message } from 'antd';
import { atom, useAtom } from 'jotai';

import { validateProxyConfig } from '@/renderer/ipcRequest/app';

const defaulAppProxyConf: IAppProxyConf = {
  proxyType: 'none',
  proxySettings: {
    protocol: 'http',
    hostname: '127.0.0.1',
    port: 1080,
  },
};
const appProxyConfAtom = atom<IAppProxyConf>(defaulAppProxyConf);
const isSettingProxyAtom = atom(true);

export function useSettingProxyModal() {
  const [appProxyConf, setAppProxyConf] = useAtom(appProxyConfAtom);
  const [isSettingProxy, setIsSettingProxy] = useAtom(isSettingProxyAtom);

  const setProxyType = useCallback(
    (proxyType: IAppProxyConf['proxyType']) => {
      setAppProxyConf((prev) => {
        return {
          ...prev,
          proxyType,
        };
      });
    },
    [setAppProxyConf]
  );

  const setProxySettings = useCallback(
    (proxySettings: Partial<IAppProxyConf['proxySettings']>) => {
      setAppProxyConf((prev) => {
        return {
          ...prev,
          proxySettings: {
            ...prev.proxySettings,
            ...proxySettings,
          },
        };
      });
    },
    [setAppProxyConf]
  );

  return {
    isSettingProxy,
    setIsSettingProxy,

    proxyType: appProxyConf.proxyType,
    setProxyType,
    proxySettings: appProxyConf.proxySettings,
    setProxySettings,
  };
}

export function useCheckProxy() {
  const [isCheckingProxy, setIsChecking] = useState(false);
  const onValidateProxy = useCallback(
    (proxySettings: IAppProxyConf['proxySettings']) => {
      if (isCheckingProxy) return;

      setIsChecking(true);
      validateProxyConfig('https://google.com', proxySettings)
        .then((res) => {
          if (res.valid) {
            message.success('Proxy is valid');
          } else {
            message.error(
              `Proxy is invalid: ${res.errMsg || 'Unknown Reason'}`
            );
          }
        })
        .finally(() => {
          setIsChecking(false);
        });
    },
    [isCheckingProxy]
  );

  return {
    isCheckingProxy,
    onValidateProxy,
  };
}
