import child_process from 'child_process';

import {
  type ProxySetting,
  type Protocol,
  getProxyWindows,
} from 'get-proxy-settings';
import type { AxiosRequestConfig } from 'axios';

import { coerceNumber } from '@/isomorphic/primitive';
import { parseScUtilProxyOutput } from '@/isomorphic/parser';

const isWin32 = process.platform === 'win32';

const command = 'scutil --proxy';

type ISimpleProxySetting = {
  host: ProxySetting['host'];
  port: ProxySetting['port'] | number;
  protocol: ProxySetting['protocol'];
  // TODO: use those two fields in proper case if provided
  credentials?: ProxySetting['credentials'];
  bypassAddrs?: string[];
};

async function getDarwinSystemHttpProxySettings(): Promise<ISimpleProxySetting | null> {
  try {
    const output = child_process.execSync(command);
    const settings = parseScUtilProxyOutput(output.toString());

    if (settings.HTTPEnable) {
      return {
        protocol: 'http' as Protocol,
        host: settings.HTTPProxy as string,
        port: settings.HTTPPort as number,
      };
    }
    if (settings.HTTPSEnable) {
      return {
        protocol: 'http' as Protocol,
        host: settings.HTTPSProxy as string,
        port: settings.HTTPSPort as number,
      };
    } /* else if (settings.SOCKSEnable) {
      return {
        protocol: 'socks' as Protocol,
        host: settings.SOCKSProxy as string,
        port: settings.SOCKSPort as number,
      }
    } */
  } catch (err) {
    console.error(err);
  }

  return null;
}

async function getWin32SystemHttpProxySettings(): Promise<ISimpleProxySetting | null> {
  const settings = await getProxyWindows();

  return settings?.https || settings?.http || null;
}

type IGetSystemProxyServer = {
  proxyURL: string;
  config: ISimpleProxySetting | null;
  configForAxios: Exclude<AxiosRequestConfig['proxy'], false> | null;
};
export async function getSystemProxyServer(forceReload = false) {
  const result: IGetSystemProxyServer = {
    proxyURL: false as any,
    config: null,
    configForAxios: null,
  };
  if ((result.proxyURL as any) === false || forceReload) {
    result.config = isWin32
      ? await getWin32SystemHttpProxySettings()
      : await getDarwinSystemHttpProxySettings();
    if (result.config) {
      const port = coerceNumber(result.config.port, 0);

      result.configForAxios = {
        protocol: result.config.protocol,
        host: result.config.host,
        port,
      };
    } else {
      result.proxyURL = '';
    }
  }

  return result;
}
