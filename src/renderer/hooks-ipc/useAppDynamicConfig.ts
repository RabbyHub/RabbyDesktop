import { useCallback, useEffect, useMemo } from 'react';
import { atom, useAtom } from 'jotai';

import { matchURLHead } from '@/isomorphic/app-config';

import tinyColor from 'tinycolor2';
import { invertColor } from '@/isomorphic/colors';

const appDynamicConfigAtom = atom({} as IAppDynamicConfig);
function useAppDynamicConfig() {
  const [appDynamicConfig, setAddDynamicConfig] = useAtom(appDynamicConfigAtom);

  const fetchConfig = useCallback(async () => {
    window.rabbyDesktop.ipcRenderer
      .invoke('get-app-dynamic-config')
      .then((result) => {
        if (result.error) {
          console.error('[useAppDynamicConfig] error', result.error);
          // forwardMessageTo('main-window', 'toast-on-mainwin', {
          //   type: 'error',
          // })
          return;
        }

        setAddDynamicConfig(result.dynamicConfig);
      });
  }, [setAddDynamicConfig]);
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    appDynamicConfig,
    fetchConfig,
  };
}

export function useMatchURLBaseConfig(urlBase?: string) {
  const { appDynamicConfig, fetchConfig } = useAppDynamicConfig();

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig, urlBase]);

  const { navTextColor, navBackgroundColor, urlBaseConf } = useMemo(() => {
    const matchedConf = matchURLHead(
      urlBase,
      appDynamicConfig?.domain_metas?.url_head
    );
    const bgColor = matchedConf?.navBgColorLight || '#ffeef9';
    const bgModel = tinyColor(bgColor);

    const textColor =
      matchedConf?.navTextColorLight ||
      (bgModel.isDark() ? invertColor(bgModel.toHex()) : '#4b4d59');

    return {
      navTextColor: textColor,
      navBackgroundColor: bgColor,
      urlBaseConf: matchedConf,
    };
  }, [urlBase, appDynamicConfig?.domain_metas?.url_head]);

  return {
    navTextColor,
    navBackgroundColor,
    urlBaseConf,
  };
}
