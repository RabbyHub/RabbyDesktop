import { useCallback, useEffect, useState } from 'react';
import { Form, message } from 'antd';
import { atom, useAtom } from 'jotai';

import {
  applyProxyConfig,
  getPersistedProxyConfig,
  validateProxyConfig,
} from '@/renderer/ipcRequest/app';

const defaulAppProxyConf: IAppProxyConf = {
  proxyType: 'none',
  proxySettings: {
    protocol: 'http',
    hostname: '127.0.0.1',
    port: 1080,
  },
};
const appProxyConfAtom = atom<IAppProxyConf>(defaulAppProxyConf);
const isSettingProxyAtom = atom(false);

export function useIsSettingProxy() {
  const [isSettingProxy, setIsSettingProxy] = useAtom(isSettingProxyAtom);

  return {
    isSettingProxy,
    setIsSettingProxy,
  };
}

export function useSettingProxyModal() {
  const [proxyCustomForm] = Form.useForm();
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

  const fetchProxyConf = useCallback(() => {
    getPersistedProxyConfig().then((result) => {
      setAppProxyConf((prev) => {
        const nextVal = {
          proxyType: result.proxyType,
          proxySettings: {
            ...prev.proxySettings,
            ...result.proxySettings,
          },
        };
        proxyCustomForm.setFieldsValue(nextVal.proxySettings);

        return nextVal;
      });
    });
  }, [setAppProxyConf, proxyCustomForm]);

  const applyProxyAndRelaunch = useCallback(() => {
    applyProxyConfig({
      proxyType: appProxyConf.proxyType,
      proxySettings: proxyCustomForm.getFieldsValue(),
    });
  }, [appProxyConf, proxyCustomForm]);

  useEffect(() => {
    fetchProxyConf();
  }, [fetchProxyConf]);

  return {
    isSettingProxy,
    setIsSettingProxy,

    proxyType: appProxyConf.proxyType,
    setProxyType,
    proxyCustomForm,

    applyProxyAndRelaunch,
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
