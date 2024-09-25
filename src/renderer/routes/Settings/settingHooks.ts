import { useCallback, useEffect, useState } from 'react';
import { type FormInstance, type InputProps, message } from 'antd';
import { atom, useAtom } from 'jotai';
import { atomWithStorage, useAtomCallback } from 'jotai/utils';

import { validateProxyConfig } from '@/renderer/ipcRequest/app';
import { formatProxyServerURL } from '@/isomorphic/url';
import { ensurePrefix } from '@/isomorphic/string';
import { walletOpenapi } from '@/renderer/ipcRequest/rabbyx';

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

const localProxyTypeAtom = atom<IRunningAppProxyConf['proxyType']>('none');
export function useLocalProxyType() {
  const [localProxyType] = useAtom(localProxyTypeAtom);

  return { localProxyType };
}
export function useSettingProxyModal({
  proxyCustomForm,
  isTopLevelComponent = false,
}: {
  proxyCustomForm: FormInstance<any>;
  isTopLevelComponent?: boolean;
}) {
  const [appProxyConf, setAppProxyConf] = useAtom(appProxyConfAtom);
  const [isSettingProxy, setIsSettingProxy] = useAtom(isSettingProxyAtom);
  const [localProxyType, setLocalProxyTypeOrig] = useAtom(localProxyTypeAtom);

  const fetchProxyConf = useCallback(
    async (opts?: { dontUpdateLocalProxyType?: boolean }) => {
      return window.rabbyDesktop.ipcRenderer
        .invoke('get-proxyConfig')
        .then((result) => {
          const runtimeConf = result.runtime;

          setAppProxyConf((prev) => {
            const nextVal: typeof runtimeConf = {
              proxyType: runtimeConf.proxyType,
              proxySettings: {
                ...prev.proxySettings,
                ...runtimeConf.proxySettings,
              },
              systemProxySettings: result.systemProxy,
              applied: runtimeConf.applied,
            };
            if (!opts?.dontUpdateLocalProxyType) {
              setLocalProxyTypeOrig(nextVal.proxyType);
            }

            proxyCustomForm.setFieldsValue(nextVal.proxySettings);

            return nextVal;
          });
        });
    },
    [setAppProxyConf, setLocalProxyTypeOrig, proxyCustomForm]
  );

  const setLocalProxyType = useCallback(
    (type: IRunningAppProxyConf['proxyType']) => {
      if (type === 'system') {
        fetchProxyConf({ dontUpdateLocalProxyType: true }).finally(() => {
          setLocalProxyTypeOrig(type);
        });
      } else {
        setLocalProxyTypeOrig(type);
      }
    },
    [fetchProxyConf, setLocalProxyTypeOrig]
  );

  const applyProxyAndRelaunch = useCallback(() => {
    window.rabbyDesktop.ipcRenderer.invoke('apply-proxyConfig', {
      proxyType: localProxyType,
      proxySettings: {
        ...appProxyConf.proxySettings,
        ...proxyCustomForm.getFieldsValue(),
      },
    });
  }, [localProxyType, appProxyConf, proxyCustomForm]);

  useEffect(() => {
    if (isTopLevelComponent) {
      fetchProxyConf();
    }
  }, [isTopLevelComponent, fetchProxyConf]);

  useEffect(() => {
    if (!isSettingProxy) {
      setLocalProxyTypeOrig(appProxyConf.proxyType);
    }
  }, [isSettingProxy, setLocalProxyTypeOrig, appProxyConf.proxyType]);

  return {
    isSettingProxy,
    setIsSettingProxy,

    localProxyType,
    setLocalProxyType,

    appProxyConf,
    isProxyApplied: appProxyConf.applied,
    proxyCustomForm,

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

const IS_REG_CHANNEL = process.env.BUILD_CHANNEL === 'reg';
export const DefaultBackendServiceValues = {
  mainnet: 'https://api.rabby.io',
  testnet: 'https://api.testnet.rabby.io',
};
const backendServiceApisAtom = atomWithStorage(
  'devOnlyBackendService',
  DefaultBackendServiceValues
);
function setHosts(newValues: typeof DefaultBackendServiceValues) {
  return Promise.all([walletOpenapi.setHost(newValues.mainnet)]);
}
export function useBackendServiceAPI(options?: { isTop?: boolean }) {
  const [curValues, _setBackendServiceApis] = useAtom(backendServiceApisAtom);
  const getValues = useAtomCallback((get) => get(backendServiceApisAtom));

  const patchBackendServiceApis = useCallback(
    async (partials: Partial<typeof DefaultBackendServiceValues>) => {
      const newValues = {
        ...(await getValues()),
        ...partials,
      };

      _setBackendServiceApis(newValues);
      // return setHosts(newValues).then(() => {
      //   _setBackendServiceApis(newValues);
      // });
    },
    [getValues, _setBackendServiceApis]
  );

  const { isTop } = options || {};

  useEffect(() => {
    if (!isTop) return;
    if (!IS_REG_CHANNEL) return;

    setHosts(curValues);
  }, [isTop, curValues]);

  return {
    mainnetURL: curValues.mainnet,
    testnetURL: curValues.testnet,
    patchBackendServiceApis,
  };
}
