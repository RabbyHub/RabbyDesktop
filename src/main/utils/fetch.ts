import path from 'path';
import url from 'url';
import { Icon as IconInfo, parseFavicon } from '@debank/parse-favicon';
import { net } from 'electron';
import { canoicalizeDappUrl } from '../../isomorphic/url';

// TODO: add test about it
export async function fetchUrl(inputURL: string) {
  // leave here for debug
  // console.log('[feat] inputURL', inputURL);
  const uinfo = url.parse(inputURL);
  type Result = {
    statusCode: number,
    statusMessage: string,
    // body: Buffer | null,
    body: Uint8Array | null,
  }

  const data = [] as Buffer[];
  return new Promise<Result>((resolve, reject) => {
    const result: Result = {
      statusCode: 404,
      statusMessage: 'Not Found',
      body: null
    }
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
      })
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

function resolveUrl(url: string, base: string) {
  return new URL(url, base).href
}

/**
 *
 * @param websiteBaseURL assume it is a valid baseURL like `${protocol}://${host}` without suffix
 */
export async function parseWebsiteFavicon (websiteBaseURL: string) {
  websiteBaseURL = websiteBaseURL.replace(/\/$/, '');

  const reqIconUrlBufs: Record<string, string> = {};

  async function textFetcher(url: string) {
    // leave here for debug
    // console.log('[feat] textFetcher:: url', url);
    return await fetchUrl(
      resolveUrl(url, websiteBaseURL)
    )
    .then(res => Buffer.from(res.body || []).toString() || '')
  }

  async function bufferFetcher(url: string) {
    // leave here for debug
    // console.log('[feat] bufferFetcher:: url', url);
    return await fetchUrl(
      resolveUrl(url, websiteBaseURL)
    )
    .then(res => {
      const arrBuf = res.body || new Uint8Array();

      reqIconUrlBufs[url] = Buffer.from(arrBuf).toString('base64');

      return arrBuf;
    })
  }

  let faviconUrl = '';
  let faviconBase64 = '';

  // TODO: use timeout mechanism
  const iconInfo = await new Promise<IconInfo>((resolve, reject) => {
    const obs = parseFavicon(websiteBaseURL, textFetcher, bufferFetcher)
      .subscribe({
        next: icon => {
          const urlInfo = canoicalizeDappUrl(icon.url).urlInfo;

          const isData = icon.url?.startsWith('data:');

          faviconUrl = urlInfo?.protocol ? icon.url : path.posix.join(websiteBaseURL, icon.url);
          faviconBase64 = isData ? icon.url : `data:${icon?.type || 'image/png'};base64,${reqIconUrlBufs[icon.url]}`;
          resolve(icon);
        },
        error: err => {
          reject(err);
        },
        complete: () => {
          obs.unsubscribe();
        }
      });
  });

  return {
    iconInfo,
    faviconUrl,
    faviconBase64,
  };
}
