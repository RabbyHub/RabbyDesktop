import { useCallback, useEffect, useState } from 'react';
import { Form, InputProps, message } from 'antd';
import { atom, useAtom } from 'jotai';

import {
  applyProxyConfig,
  validateProxyConfig,
} from '@/renderer/ipcRequest/app';
import { formatProxyServerURL } from '@/isomorphic/url';
import { ensurePrefix } from '@/isomorphic/string';

const defaulAppProxyConf: IAppProxyConf = {
  proxyType: 'none',
  proxySettings: {
    protocol: 'http',
    hostname: '127.0.0.1',
    port: 1080,
  },
};
const appProxyConfAtom = atom<IRunningAppProxyConf>({
  ...defaulAppProxyConf,
  applied: false,
});
const isSettingProxyAtom = atom(false);

export function useProxyStateOnSettingPage() {
  const [appProxyConf] = useAtom(appProxyConfAtom);
  const [, setIsSettingProxy] = useAtom(isSettingProxyAtom);

  return {
    proxyType: appProxyConf.proxyType,
    customProxyServer: formatProxyServerURL(appProxyConf.proxySettings),
    setIsSettingProxy,
  };
}

export function useSettingProxyModal() {
  const [proxyCustomForm] = Form.useForm();
  const [appProxyConf, setAppProxyConf] = useAtom(appProxyConfAtom);
  const [isSettingProxy, setIsSettingProxy] = useAtom(isSettingProxyAtom);

  const [localProxyType, setLocalProxyType] = useState(appProxyConf.proxyType);

  const fetchProxyConf = useCallback(() => {
    window.rabbyDesktop.ipcRenderer.invoke('get-proxyConfig').then((result) => {
      const { persisted } = result;
      const runtimeConf = result.runtime;

      setAppProxyConf((prev) => {
        const nextVal = {
          proxyType: runtimeConf.proxyType,
          proxySettings: {
            ...prev.proxySettings,
            ...runtimeConf.proxySettings,
          },
          applied: runtimeConf.applied,
        };
        setLocalProxyType(nextVal.proxyType);
        proxyCustomForm.setFieldsValue(nextVal.proxySettings);

        return nextVal;
      });
    });
  }, [setAppProxyConf, proxyCustomForm]);

  const applyProxyAndRelaunch = useCallback(() => {
    applyProxyConfig({
      proxyType: localProxyType,
      proxySettings: proxyCustomForm.getFieldsValue(),
    });
  }, [localProxyType, proxyCustomForm]);

  useEffect(() => {
    fetchProxyConf();
  }, [fetchProxyConf]);

  return {
    isSettingProxy,
    setIsSettingProxy,

    localProxyType,
    setLocalProxyType,

    proxyType: appProxyConf.proxyType,
    proxyCustomForm,
    isProxyApplied: appProxyConf.applied,

    applyProxyAndRelaunch,
  };
}

export function useCheckProxy() {
  const [isCheckingProxy, setIsChecking] = useState(false);
  const [checkingTarget, setCheckingTarget] = useState('google.com');
  const onValidateProxy = useCallback(
    (proxySettings: IAppProxyConf['proxySettings']) => {
      if (isCheckingProxy) return;

      const targetURL = ensurePrefix(checkingTarget, 'https://');

      setIsChecking(true);
      validateProxyConfig(targetURL, proxySettings)
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
    [isCheckingProxy, checkingTarget]
  );

  const onCheckingTargetChange: InputProps['onChange'] & object = useCallback(
    (evt) => {
      setCheckingTarget(evt.target.value);
    },
    [setCheckingTarget]
  );

  return {
    isCheckingProxy,
    onValidateProxy,
    checkingTarget,
    onCheckingTargetChange,
  };
}

const isViewingDevicesAtom = atom(false);
export function useIsViewingDevices() {
  const [isViewingDevices, setIsViewingDevices] = useAtom(isViewingDevicesAtom);

  return {
    isViewingDevices,
    setIsViewingDevices,
  };
}
