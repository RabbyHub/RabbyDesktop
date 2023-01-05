import path from 'path';
import { parse as parseUrl } from 'url';
import { Icon as IconInfo, parseFavicon } from '@debank/parse-favicon';
import { net } from 'electron';
import { catchError, firstValueFrom, map, of, timeout } from 'rxjs';
import { canoicalizeDappUrl } from '../../isomorphic/url';

// TODO: add test about it
export async function fetchUrl(inputURL: string) {
  // leave here for debug
  // console.log('[debug] inputURL', inputURL);
  const uinfo = parseUrl(inputURL);
  type Result = {
    statusCode: number;
    statusMessage: string;
    // body: Buffer | null,
    body: Uint8Array | null;
  };

  const data = [] as Buffer[];
  return new Promise<Result>((resolve, reject) => {
    const result: Result = {
      statusCode: 404,
      statusMessage: 'Not Found',
      body: null,
    };
    const req = net.request({
      method: 'GET',
      protocol: uinfo.protocol!,
      hostname: uinfo.hostname!,
      port: uinfo.port as any as number,
      path: uinfo.pathname || '/',
    });

    req.on('response', (response) => {
      result.statusCode = response.statusCode;
      result.statusMessage = response.statusMessage;

      response.on('data', (chunk) => {
        data.push(chunk);
      });

      response.on('end', () => {
        const bufs = Buffer.concat(data);

        const bodyBuf = new Uint8Array(bufs);
        result.body = bodyBuf;

        resolve(result);
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

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
  }
) {
  const { timeout: tmout = 2 * 1e3 } = options || {};
  websiteBaseURL = websiteBaseURL.replace(/\/$/, '');

  const reqIconUrlBufs: Record<string, string> = {};

  async function textFetcher(url: string) {
    // leave here for debug
    // console.debug('[debug] textFetcher:: websiteBaseURL, url', websiteBaseURL, url);

    const href = getHref(url, websiteBaseURL);
    if (!href) return '';
    return fetchUrl(href).then(
      (res) => Buffer.from(res.body || []).toString() || ''
    );
  }

  async function bufferFetcher(url: string) {
    // leave here for debug
    // console.debug('[debug] bufferFetcher:: websiteBaseURL, url', websiteBaseURL, url);

    const href = getHref(url, websiteBaseURL);
    if (!href) return Buffer.from([]);
    return fetchUrl(href).then((res) => {
      const arrBuf = res.body || new Uint8Array();

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
