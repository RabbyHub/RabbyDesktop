/// <reference path="../../isomorphic/types.d.ts" />

import { format as urlFormat } from 'url';
import Axios, { AxiosError, AxiosProxyConfig } from 'axios';
import LRUCache from 'lru-cache';
import { BrowserWindow, nativeImage } from 'electron';

import { unfurl } from 'unfurl.js';
import nodeFetch from 'node-fetch';
import createHttpsProxyAgent from 'https-proxy-agent';

import { waitForMS } from '@/isomorphic/date';
import {
  canoicalizeDappUrl,
  formatAxiosProxyConfig,
} from '../../isomorphic/url';
import { fetchImageBuffer, parseWebsiteFavicon } from './fetch';
import { AxiosElectronAdapter } from './axios';
import { checkUrlViaBrowserView, CHROMIUM_NET_ERR_DESC } from './appNetwork';
import { createPopupWindow } from './browser';

const DFLT_TIMEOUT = 8 * 1e3;

// eslint-disable-next-line @typescript-eslint/naming-convention
const enum DETECT_ERR_CODES {
  NOT_HTTPS = 'NOT_HTTPS',
  INACCESSIBLE = 'INACCESSIBLE',
  REDIRECTED_OUT = 'REDIRECTED_OUT',
  HTTPS_CERT_INVALID = 'HTTPS_CERT_INVALID',
  TIMEOUT = 'TIMEOUT',

  REPEAT = 'REPEAT',
}

async function checkDappHttpsCert(
  dappOrigin: string,
  opts?: Parameters<typeof checkUrlViaBrowserView>[1]
): Promise<
  | {
      type: DETECT_ERR_CODES.HTTPS_CERT_INVALID;
      errorCode: CHROMIUM_NET_ERR_DESC;
    }
  | {
      type: DETECT_ERR_CODES.TIMEOUT;
      errorCode?: null;
    }
  | null
> {
  const checkResult = await checkUrlViaBrowserView(dappOrigin, opts);

  if (checkResult.valid) return null;

  if (checkResult.isTimeout)
    return {
      type: DETECT_ERR_CODES.TIMEOUT,
    };

  return {
    type: DETECT_ERR_CODES.HTTPS_CERT_INVALID,
    errorCode: checkResult.certErrorDesc!,
  };
}

let previewWindow: BrowserWindow;
const WAIT_RENDER_TIME = 2 * 1e3;
export async function safeCapturePage(
  targetURL: string,
  opts?: {
    timeout?: number;
  }
): Promise<{
  previewImg: Uint8Array | null;
  error?: string | null;
}> {
  if (!previewWindow) {
    previewWindow = createPopupWindow({
      width: 1366,
      height: 768,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webviewTag: false,
      },
    });
  }

  const { timeout: timeoutValue = 8 * 1e3 } = opts || {};

  previewWindow.loadURL(targetURL);

  const p = new Promise<Uint8Array | null>((resolve, reject) => {
    let timeouted = false;

    setTimeout(() => {
      timeouted = true;
      reject(new Error('timeout'));
    }, timeoutValue + WAIT_RENDER_TIME);

    previewWindow.webContents.on('did-fail-load', () => {
      reject();
    });

    previewWindow.webContents.on('certificate-error', () => {
      reject();
    });

    previewWindow.webContents.on('did-finish-load', async () => {
      // wait for 1s to make sure the page is loaded
      waitForMS(WAIT_RENDER_TIME)
        .then(() => previewWindow.webContents.capturePage())
        .then((image) => {
          if (timeouted) return;

          resolve(image.toPNG());
        })
        .catch(reject);
    });
  });

  let previewImg: Uint8Array | string | null = null;
  let error: string | null = null;
  try {
    previewImg = await p;
  } catch (e: any) {
    if (e?.message === 'timeout') {
      error = 'Preview timeout';
    } else {
      error = 'Error occured on Preview dapp';
    }
    previewImg = null;
  } finally {
    previewWindow.loadURL('about:blank');
    // previewWindow.close();
    // previewWindow.destroy();
  }

  return {
    previewImg,
    error,
  };
}

const findLargestFavIcon = (
  icons: { href: string; sizes: string }[]
): string => {
  let largest: { href: string; size: number } | null = null;
  icons.forEach((icon) => {
    const sizes = icon.sizes.split(' ');
    /**
     * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link
     * link 的 sizes 字段可以写多个长宽比，以空格拆分，且 100x100 和 100X100 都是合法的
     * 这里无脑认为 link 的图标都是 1:1 的，且取 x 之前的宽度来计算
     * */
    const maxSize = Math.max(
      ...sizes.map((s) => Number(s.toLowerCase().split('x')[0] || 0))
    );
    if (!largest) {
      largest = {
        href: icon.href,
        size: maxSize,
      };
    } else if (maxSize > largest.size) {
      largest = {
        href: icon.href,
        size: maxSize,
      };
    }
  });

  return (largest as { href: string; size: number } | null)?.href || '';
};

export async function detectDapp(
  dappsUrl: string,
  opts: {
    existedDapps: IDapp[];
    proxyOnGrab?: AxiosProxyConfig;
  }
): Promise<IDappsDetectResult<DETECT_ERR_CODES>> {
  const { proxyOnGrab } = opts;
  // TODO: process void url;
  const { origin: inputOrigin, hostWithoutTLD: inputCoreName } =
    canoicalizeDappUrl(dappsUrl);
  const { urlInfo: dappOriginInfo } = canoicalizeDappUrl(inputOrigin);

  if (dappOriginInfo?.protocol !== 'https:') {
    return {
      data: null,
      error: {
        type: DETECT_ERR_CODES.NOT_HTTPS,
        message: 'Dapp with protocols other than HTTPS is not supported',
      },
    };
  }
  const formattedTargetURL = urlFormat(dappOriginInfo);
  let fallbackFavicon: string | undefined;

  const [checkResult, targetMetadata] = await Promise.all([
    await checkUrlViaBrowserView(formattedTargetURL, {
      onPageFaviconUpdated: (favicons) => {
        fallbackFavicon = findLargestFavIcon(favicons);
      },
      timeout: DFLT_TIMEOUT,
    }),
    await unfurl(formattedTargetURL, {
      fetch: async (url) => {
        const agent = proxyOnGrab
          ? createHttpsProxyAgent(formatAxiosProxyConfig(proxyOnGrab))
          : undefined;

        return nodeFetch(url, {
          headers: {
            Accept: 'text/html, application/xhtml+xml',
            'User-Agent': 'facebookexternalhit',
          },
          follow: 100,
          size: 0, // no limit
          timeout: DFLT_TIMEOUT,
          agent,
        });
      },
    }).catch((err) => {
      console.debug(`[detectDapp] unfurl error occured`);
      console.error(err);
      return null;
    }),
  ]);

  const isCertErr = !checkResult.valid && !!checkResult.certErrorDesc;

  if (isCertErr) {
    return {
      data: null,
      error: {
        type: DETECT_ERR_CODES.HTTPS_CERT_INVALID,
        message: checkResult.certErrorDesc,
      },
    };
  }
  if (!checkResult.valid) {
    if (checkResult.isTimeout) {
      return {
        data: null,
        error: {
          type: DETECT_ERR_CODES.TIMEOUT,
          message:
            'Access to Dapp timed out. Please check your network and retry.',
        },
      };
    }

    return {
      data: null,
      error: {
        type: DETECT_ERR_CODES.INACCESSIBLE,
        message: 'The Domain cannot be accessed.',
      },
    };
  }

  const { origin: finalOrigin, fullDomain: finalDomain } = canoicalizeDappUrl(
    checkResult.finalUrl
  );

  if (checkResult.isRedirectedOut) {
    return {
      data: null,
      error: {
        type: DETECT_ERR_CODES.REDIRECTED_OUT,
        message: `Cannot be added as a Dapp: the current domain has been redirected to ${finalDomain}, which may pose a security risk.`,
      },
    };
  }

  const repeatedInputDapp = opts.existedDapps.find(
    (item) => item.origin === inputOrigin
  );
  const repeatedFinalDapp = opts.existedDapps.find(
    (item) => item.origin === finalOrigin
  );

  const data: IDappsDetectResult['data'] = {
    inputOrigin,
    isInputExistedDapp: !!repeatedInputDapp,
    finalOrigin,
    isFinalExistedDapp: !!repeatedFinalDapp,
    icon: null,
    recommendedAlias:
      targetMetadata?.open_graph?.site_name ||
      targetMetadata?.open_graph?.title ||
      targetMetadata?.twitter_card?.site ||
      targetMetadata?.twitter_card?.title ||
      targetMetadata?.title ||
      inputCoreName,
    faviconUrl:
      fallbackFavicon ||
      targetMetadata?.favicon ||
      targetMetadata?.open_graph?.images?.[0]?.url ||
      targetMetadata?.twitter_card?.images?.[0]?.url,
    faviconBase64: undefined,
  };

  const repeatedDapp = repeatedInputDapp || repeatedFinalDapp;
  if (repeatedDapp) {
    data.faviconUrl = repeatedDapp.faviconUrl;
    data.faviconBase64 = repeatedDapp.faviconBase64;
    data.recommendedAlias = repeatedDapp.alias || inputCoreName;

    return {
      data,
      error: {
        type: DETECT_ERR_CODES.REPEAT,
        message: 'This Dapp has been added',
      },
    };
  }

  // TODO: if existed, fetch the url and store as base64
  if (!data.faviconUrl) {
    const { iconInfo, faviconUrl, faviconBase64 } = await parseWebsiteFavicon(
      finalOrigin,
      {
        timeout: DFLT_TIMEOUT,
        proxy: proxyOnGrab,
      }
    );

    data.icon = iconInfo;
    data.faviconUrl = faviconUrl || fallbackFavicon;
    data.faviconBase64 = faviconBase64;
  } else if (!data.faviconBase64) {
    await fetchImageBuffer(data.faviconUrl, {
      timeout: DFLT_TIMEOUT,
      proxy: proxyOnGrab,
    })
      .then((faviconBuf) => {
        data.faviconBase64 = nativeImage
          .createFromBuffer(faviconBuf)
          .toDataURL();
      })
      .catch((error) => {
        console.error(`[detectDapp] fetch favicon error occured: `, error);
      });
  }

  return { data };
}

const isProd = process.env.NODE_ENV === 'production';

const OPENAPI_BASEURL = !isProd
  ? 'https://alpha-pro-openapi.debank.com'
  : 'https://pro-openapi.debank.com';

const openApiClient = Axios.create({
  baseURL: OPENAPI_BASEURL,
  adapter: AxiosElectronAdapter,
});

async function createDappDetection({ dapp_origin = '' }) {
  return openApiClient.post<{
    is_success: boolean;
    id: string;
  }>('/cloud/dapp', {
    origin: dapp_origin,
  });
}

export async function queryDappLatestUpdateInfo({
  dapp_origin = '',
  dapp_id = '',
  limit = 10,
  start = 0,
  is_changed = true,
}) {
  let dappId = dapp_id;
  if (!dappId) {
    const resp = await createDappDetection({ dapp_origin });

    dappId = resp.data.id;
  }

  return openApiClient
    .get<{
      total: boolean;
      detect_list: IDappUpdateDetectionItem[];
    }>(`/cloud/dapp/${dappId}/detect`, {
      params: {
        limit,
        start,
        is_changed,
      },
    })
    .then((res) => res.data);
}

function getMockedChanged(dapp_id: string) {
  return {
    dapp_id,
    version: '482edf6719d385a4362f28f86d19025a',
    is_changed: true,
    new_detected_address_list: [],
    create_at: (Date.now() - 30 * 1e3) / 1e3,
  };
}

const securityCheckResults = new LRUCache<
  IDapp['origin'],
  ISecurityCheckResult
>({
  max: 500,
  // maxSize: 5000,
  // one day
  ttl: 1000 * 60 * 60 * 24,
});

async function doCheckDappOrigin(dappOrigin: string) {
  // TODO: catch error here
  const [httpsCheckResult, latestUpdateResult] = await Promise.all([
    checkDappHttpsCert(dappOrigin),
    queryDappLatestUpdateInfo({
      dapp_origin: dappOrigin,
    })
      .then((json) => {
        const latestItem = json.detect_list?.[0] || null;
        const latestChangedItemIn24Hr =
          json.detect_list?.find(
            (item) =>
              item.is_changed &&
              Date.now() - item.create_at * 1e3 < 24 * 60 * 60 * 1e3
          ) || null;

        return {
          timeout: false,
          latestItem: latestItem || null,
          latestChangedItemIn24Hr,
          /**
           * leave here to mock the result
           */
          // latestChangedItemIn24Hr: getMockedChanged(latestItem?.dapp_id)
        };
      })
      .catch((err) => {
        if ((err as AxiosError).code === 'timeout') {
          return {
            timeout: true,
            latestItem: null,
            latestChangedItemIn24Hr: null,
            error: err.message,
          };
        }
        return {
          timeout: false,
          latestItem: null,
          latestChangedItemIn24Hr: null,
          error: 'unknown',
        };
      }),
  ]);

  /**
   * leave here to mock cert invalid error
   */
  // httpsCheckResult = httpsCheckResult || {} as any;
  // httpsCheckResult!.type = DETECT_ERR_CODES.HTTPS_CERT_INVALID;

  const checkHttps: ISecurityCheckResult['checkHttps'] =
    httpsCheckResult?.type === 'HTTPS_CERT_INVALID'
      ? {
          level: 'danger',
          httpsError: true,
          chromeErrorCode: httpsCheckResult.errorCode,
        }
      : {
          level: httpsCheckResult?.type === 'TIMEOUT' ? 'danger' : 'ok',
          httpsError: false,
          timeout: httpsCheckResult?.type === 'TIMEOUT',
        };

  // normalize result
  let countWarnings = 0;
  let countDangerIssues = 0;
  let resultLevel = undefined as any as ISecurityCheckResult['resultLevel'];

  const checkLatestUpdate: ISecurityCheckResult['checkLatestUpdate'] = {
    ...latestUpdateResult,
    level: 'ok',
  };
  if (
    (latestUpdateResult.latestChangedItemIn24Hr?.create_at &&
      latestUpdateResult.latestChangedItemIn24Hr?.is_changed) ||
    latestUpdateResult.timeout
  ) {
    countWarnings++;
    checkLatestUpdate.level = 'warning';
    resultLevel = resultLevel || checkLatestUpdate.level;
  }

  if (checkHttps.httpsError || checkHttps.timeout) {
    countDangerIssues++;
    resultLevel = 'danger';
  }

  resultLevel = resultLevel || 'ok';

  const checkResult: ISecurityCheckResult = {
    origin: dappOrigin,
    countWarnings,
    countDangerIssues,
    countIssues: countWarnings + countDangerIssues,
    resultLevel,
    timeout: !!(checkHttps.timeout || latestUpdateResult.timeout),
    checkHttps,
    checkLatestUpdate,
  };

  return checkResult;
}

export async function getOrPutCheckResult(
  dappUrl: string,
  options?: {
    wait?: boolean;
    updateOnSet?: boolean;
  }
) {
  const { origin: dappOrigin } = canoicalizeDappUrl(dappUrl);

  let checkResult = securityCheckResults.get(dappOrigin);

  if (!checkResult) {
    checkResult = await doCheckDappOrigin(dappOrigin);
    securityCheckResults.set(dappOrigin, checkResult);
  } else if (options?.updateOnSet) {
    const p = doCheckDappOrigin(dappOrigin);

    if (options?.wait) {
      try {
        securityCheckResults.set(dappOrigin, await p);
      } catch (e) {
        console.error(e);
      }
    }
  }

  return checkResult;
}
