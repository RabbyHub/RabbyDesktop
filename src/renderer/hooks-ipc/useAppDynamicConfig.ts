import Axios from 'axios';
import { useRequest } from 'ahooks';
import { useCallback, useEffect, useMemo } from 'react';
import { atom, useAtom } from 'jotai';

import { matchURLHead } from '@/isomorphic/app-config';

import tinyColor from 'tinycolor2';
import { invertColor } from '@/isomorphic/colors';
import { canoicalizeDappUrl } from '@/isomorphic/url';
import { isEqual } from 'lodash';
import { getSpecialDomain } from '../utils/specialDomain';

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

const DEFAULT_COLOR = {
  backgroundColor: 'rgba(0, 0, 0, 0.2)',
  textColor: 'rgba(255, 255, 255, 0.8)',
};
function safeParseColor(defaultColor: string, remoteColor?: string) {
  const remoteModel = tinyColor(remoteColor);
  const defaultmodel = tinyColor(defaultColor);
  const isFromRemote =
    remoteModel.isValid() &&
    remoteModel.toRgbString() !== defaultmodel.toRgbString();

  return {
    model: isFromRemote ? remoteModel : defaultmodel,
    color: isFromRemote ? remoteModel.toRgbString() : defaultColor,
    isFromRemote,
    remoteModel,
    remoteColor,
    remoteInvertedColor: isFromRemote
      ? invertColor(remoteModel.toHex()!)
      : undefined,
    defaultmodel,
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
    const defaultColors = {
      ...DEFAULT_COLOR,
      ...appDynamicConfig?.domain_metas?.url_head?.default,
    };
    const bgColors = safeParseColor(
      defaultColors.backgroundColor,
      matchedConf?.navBgColorLight
    );
    const textColors = !bgColors.isFromRemote
      ? safeParseColor(defaultColors.textColor)
      : safeParseColor(
          tinyColor(bgColors.remoteInvertedColor)
            .setAlpha(1 - bgColors.remoteModel.getAlpha())
            .toRgbString(),
          matchedConf?.navTextColorLight
        );

    const navIconColor = textColors.model.brighten(10).toRgbString();
    const navDividerColor = textColors.model.setAlpha(0.1).toRgbString();

    return {
      navTextColor: textColors.color,
      navIconColor,
      navDividerColor,
      navBackgroundColor: bgColors.color,
    };
  }, [urlBase, appDynamicConfig?.domain_metas?.url_head]);
}

export const useGetSpecialDomain = () => {
  // const { appDynamicConfig } = useAppDynamicConfig();
  const { data } = useRequest(
    () => {
      return Axios.get<{ ids: string[] }>(
        `https://api.rabby.io/v1/domain/share_list`
      );
    },
    {
      cacheKey: 'useCheckSpecialDomain',
    }
  );

  const domains = useMemo(() => data?.data?.ids || [], [data?.data?.ids]);

  return useCallback(
    (url: string) => {
      console.log(url, domains);
      return getSpecialDomain(url, domains);
    },
    [domains]
  );
};
