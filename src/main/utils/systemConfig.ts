import child_process from 'child_process';

import { type ProxySetting, getProxyWindows } from 'get-proxy-settings';
import type { AxiosRequestConfig } from 'axios';

import { coerceNumber } from '@/isomorphic/primitive';
import { formatProxyServerURL } from '@/isomorphic/url';

const command = 'scutil --proxy';
async function getDarwinSystemProxySettings(): Promise<ProxySetting | null> {
  const output = child_process.execSync(command);
  // var settings = parseSettings(output);
  // return settings;

  return null;
}

async function getWin32SystemProxySettings(): Promise<ProxySetting | null> {
  const settings = await getProxyWindows();

  return settings?.https || settings?.http || null;
}

let systemProxyURL: string | false = false;
type IGetSystemProxyServer = {
  proxyURL: string;
  config: ProxySetting | null;
  configForAxios: Exclude<AxiosRequestConfig['proxy'], false> | null;
};
export async function getSystemProxyServer(forceReload = false) {
  const result: IGetSystemProxyServer = {
    proxyURL: false as any,
    config: null,
    configForAxios: null,
  };
  if ((result.proxyURL as any) === false || forceReload) {
    result.config =
      process.platform === 'win32'
        ? await getWin32SystemProxySettings()
        : await getDarwinSystemProxySettings();
    if (result.config) {
      const port = coerceNumber(result.config.port, 0);

      systemProxyURL = formatProxyServerURL({
        // TODO: maybe we need to support https here
        protocol: result.config.protocol as any,
        hostname: result.config.host,
        port,
      });

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
