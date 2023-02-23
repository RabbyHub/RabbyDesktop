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

  return useMemo(() => {
    const matchedConf = matchURLHead(
      urlBase,
      appDynamicConfig?.domain_metas?.url_head
    );
    const bgColor = matchedConf?.navBgColorLight || 'rgba(0, 0, 0, 0.2)';

    // const bgModel = tinyColor(bgColor);
    // const textColor =
    //   matchedConf?.navTextColorLight ||
    //   (bgModel.isDark() ? invertColor(bgModel.toHex(), true) : 'rgba(255, 255, 255, 0.8)');
    const textColor =
      matchedConf?.navTextColorLight || 'rgba(255, 255, 255, 0.8)';

    const navIconColor = tinyColor(textColor).brighten(10).toHex();
    const dividerBorderColor = tinyColor(textColor).brighten(10).toHex();

    return {
      navTextColor: textColor,
      navIconColor,
      navDividerColor: dividerBorderColor,
      navBackgroundColor: bgColor,
      urlBaseConf: matchedConf,
    };
  }, [urlBase, appDynamicConfig?.domain_metas?.url_head]);
}
