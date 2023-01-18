import path from 'path';
import { Icon as IconInfo, parseFavicon } from '@debank/parse-favicon';
import Axios, { AxiosProxyConfig } from 'axios';

import { catchError, firstValueFrom, map, of, timeout } from 'rxjs';
import { canoicalizeDappUrl } from '../../isomorphic/url';

const fetchClient = Axios.create({});

function getHref(url: string, base: string) {
  try {
    return new URL(url, base).href;
  } catch (error) {
    return '';
  }
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
) {
  const { timeout: tmout = 2 * 1e3 } = options || {};
  websiteBaseURL = websiteBaseURL.replace(/\/$/, '');

  const reqIconUrlBufs: Record<string, string> = {};

  async function textFetcher(url: string) {
    // leave here for debug
    // console.debug('[debug] textFetcher:: websiteBaseURL, url', websiteBaseURL, url);

    const targetURL = getHref(url, websiteBaseURL);
    if (!targetURL) return '';

    return fetchClient
      .get(targetURL, {
        timeout: tmout,
        proxy: options?.proxy,
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
        proxy: options?.proxy,
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
