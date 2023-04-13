import child_process from 'child_process';

import {
  type ProxySetting,
  type Protocol,
  getProxyWindows,
} from 'get-proxy-settings';

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

export type ISysProxyInfo = {
  config: ISimpleProxySetting | null;
  systemProxySettings: IAppProxyConf['systemProxySettings'];
};
const state: {
  fetched: boolean;
  config: ISysProxyInfo['config'];
} = {
  fetched: false,
  config: null,
};
export async function getSystemProxyInfo(forceReload = false) {
  const result: ISysProxyInfo = {
    config: state.config ? { ...state.config } : null,
    systemProxySettings: undefined,
  };
  if (!state.fetched || forceReload) {
    result.config = isWin32
      ? await getWin32SystemHttpProxySettings()
      : await getDarwinSystemHttpProxySettings();

    state.fetched = true;
  }

  if (result.config) {
    const port = coerceNumber(result.config.port, 0);

    result.systemProxySettings = {
      protocol: result.config.protocol as 'http',
      host: result.config.host,
      port,
    };
  } else {
    result.systemProxySettings = undefined;
  }

  return result;
}
