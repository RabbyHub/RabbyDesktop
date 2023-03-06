import path from 'path';
import { Icon as IconInfo, parseFavicon } from '@debank/parse-favicon';
import Axios, { AxiosProxyConfig } from 'axios';

import { catchError, firstValueFrom, map, of, timeout } from 'rxjs';
import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import {
  canoicalizeDappUrl,
  formatAxiosProxyConfig,
} from '../../isomorphic/url';
import { IS_APP_PROD_BUILD } from './app';

const fetchClient = Axios.create({});

function getHref(url: string, base: string) {
  try {
    return new URL(url, base).href;
  } catch (error) {
    return '';
  }
}

function filterAxiosProxy(proxyConfig?: AxiosProxyConfig) {
  const resultConfig =
    proxyConfig?.protocol === 'socks5' ? undefined : proxyConfig;

  return resultConfig;
}

/**
 *
 * @param websiteBaseURL assume it is a valid baseURL like `${protocol}://${host}` without suffix
 */
export async function parseWebsiteFavicon(
  websiteBaseURL: string,
  options?: {
    timeout?: number;
    proxy?: AxiosProxyConfig;
  }
): Promise<IParsedFavicon> {
  const { timeout: tmout = 2 * 1e3 } = options || {};
  websiteBaseURL = websiteBaseURL.replace(/\/$/, '');

  const reqIconUrlBufs: Record<string, string> = {};

  const axiosProxy = filterAxiosProxy(options?.proxy);

  if (axiosProxy && !IS_RUNTIME_PRODUCTION) {
    console.debug(
      `[debug] use proxy ${formatAxiosProxyConfig(
        axiosProxy
      )} on parsing favicon`
    );
  }

  async function textFetcher(url: string) {
    // leave here for debug
    // console.debug('[debug] textFetcher:: websiteBaseURL, url', websiteBaseURL, url);

    const targetURL = getHref(url, websiteBaseURL);
    if (!targetURL) return '';

    return fetchClient
      .get(targetURL, {
        timeout: tmout,
        proxy: axiosProxy,
      })
      .then((res) => res.data);
  }

  async function bufferFetcher(url: string) {
    // leave here for debug
    // console.debug('[debug] bufferFetcher:: websiteBaseURL, url', websiteBaseURL, url);

    const targetURL = getHref(url, websiteBaseURL);
    if (!targetURL) return Buffer.from([]);
    return fetchClient
      .get(targetURL, {
        timeout: tmout,
        proxy: axiosProxy,
        responseType: 'arraybuffer',
      })
      .then((res) => {
        const arrBuf = Buffer.from(res.data, 'binary');

        reqIconUrlBufs[url] = Buffer.from(arrBuf).toString('base64');

        return arrBuf;
      });
  }

  let faviconUrl = '';
  let faviconBase64 = '';

  const obs = parseFavicon(websiteBaseURL, textFetcher, bufferFetcher).pipe(
    timeout(tmout),
    map((icon) => {
      const { urlInfo } = canoicalizeDappUrl(icon.url);

      const isData = icon.url?.startsWith('data:');

      faviconUrl = urlInfo?.protocol
        ? icon.url
        : path.posix.join(websiteBaseURL, icon.url);
      faviconBase64 = isData
        ? icon.url
        : `data:${icon?.type || 'image/png'};base64,${
            reqIconUrlBufs[icon.url]
          }`;

      return icon;
    }),
    catchError((err) => {
      console.error(err);
      return of(null);
    })
  );

  let iconInfo: IconInfo | null = null;
  try {
    iconInfo = await firstValueFrom(obs);
  } catch (err) {
    console.error(err);
  }

  return {
    iconInfo,
    faviconUrl: faviconUrl || undefined,
    faviconBase64: faviconBase64 || undefined,
  };
}

const configURLs = IS_APP_PROD_BUILD
  ? {
      domain_metas: `https://download.rabby.io/cdn-config/dapps/domain_metas.json`,
      blockchain_explorers: `https://download.rabby.io/cdn-config/dapps/blockchain_explorers.json`,
    }
  : {
      domain_metas: `https://download.rabby.io/cdn-config-pre/dapps/domain_metas.json`,
      blockchain_explorers: `https://download.rabby.io/cdn-config-pre/dapps/blockchain_explorers.json`,
    };

export const DEFAULT_BLOCKCHAIN_EXPLORERS = ['etherscan.io'];

export async function fetchDynamicConfig(options?: {
  timeout?: number;
  proxy?: AxiosProxyConfig;
}) {
  const { timeout: timeoutV = 5 * 1e3, proxy } = options || {};
  const [
    domain_metas = {},
    blockchain_explorers = Array.from(DEFAULT_BLOCKCHAIN_EXPLORERS),
    special_main_domains = {},
  ] = await Promise.all([
    fetchClient
      .get(`${configURLs.domain_metas}?t=${Date.now()}`, {
        timeout: timeoutV,
        proxy,
      })
      .then((res) => res.data)
      .catch((err) => undefined), // TODO: report to sentry
    fetchClient
      .get(`${configURLs.blockchain_explorers}?t=${Date.now()}`, {
        timeout: timeoutV,
        proxy,
      })
      .then((res) => res.data)
      .catch((err) => undefined), // TODO: report to sentry

    fetchClient
      .get(`https://api.rabby.io/v1/domain/share_list`, {
        timeout: timeoutV,
        proxy,
      })
      .then((res) => res.data)
      .catch((err) => undefined), // TODO: report to sentry
  ]);

  return {
    domain_metas: (domain_metas as IAppDynamicConfig['domain_metas']) || {},
    blockchain_explorers:
      (blockchain_explorers as IAppDynamicConfig['blockchain_explorers']) || [],
    special_main_domains:
      (special_main_domains as IAppDynamicConfig['special_main_domains']) || {},
  };
}

// const DFLT_TIMEOUT = 8 * 1e3;
// import nodeFetch, { AbortError } from 'node-fetch'; // for node-fetch@3
// type FetchParams = Parameters<typeof nodeFetch>;
// /**
//  * @description just one wrapper for node-fetch
//  */
// export async function appFetch(
//   url: FetchParams[0],
//   options?: FetchParams[1] & {
//     timeout?: number;
//   }
// ) {
//   const { timeout: timeoutValue = DFLT_TIMEOUT, ...fetchOptions } =
//     options || {};
//   const controller = new AbortController();

//   const timer = timeoutValue
//     ? setTimeout(() => {
//         controller.abort();
//       }, timeoutValue)
//     : undefined;

//   return nodeFetch(url, fetchOptions)
//     .catch((error) => {
//       if (error instanceof AbortError) {
//         throw new Error('timeout');
//       }
//       throw error;
//     })
//     .finally(() => {
//       clearTimeout(timer);
//     });
// }
