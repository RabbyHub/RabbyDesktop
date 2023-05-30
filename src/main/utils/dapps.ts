/// <reference path="../../isomorphic/types.d.ts" />

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

import * as Sentry from '@sentry/electron/main';

import { format as urlFormat } from 'url';
import Axios, { AxiosError, AxiosProxyConfig } from 'axios';
import LRUCache from 'lru-cache';
import { BrowserWindow, net } from 'electron';

import { waitForMS } from '@/isomorphic/date';
import {
  extractCssTagsFromHtml,
  pickFavIconURLFromMeta,
} from '@/isomorphic/html';
import { PROTOCOL_IPFS } from '@/isomorphic/constants';
import { checkoutDappURL } from '@/isomorphic/dapp';
import { ensurePrefix, unPrefix, unSuffix } from '@/isomorphic/string';
import { canoicalizeDappUrl } from '../../isomorphic/url';
import { AxiosElectronAdapter } from './axios';
import { checkUrlViaBrowserView, CHROMIUM_NET_ERR_DESC } from './appNetwork';
import { createPopupWindow } from './browser';
import { getSessionInsts } from './stream-helpers';
import { emitIpcMainEvent } from './ipcMainEvents';

const DFLT_TIMEOUT = 8 * 1e3;

// eslint-disable-next-line @typescript-eslint/naming-convention
const enum DETECT_ERR_CODES {
  NOT_HTTPS = 'NOT_HTTPS',
  NOT_IPFS = 'NOT_IPFS',
  NOT_LOCALFS = 'NOT_LOCALFS',

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

export async function detectLocalDapp(
  localDappPath: ICheckedOutDappURL | string,
  opts: {
    existedDapps: IDapp[];
  }
): Promise<IDappsDetectResult<DETECT_ERR_CODES>> {
  const checkedOutDappInfo =
    typeof localDappPath === 'string'
      ? checkoutDappURL(localDappPath)
      : localDappPath;
  const inputOrigin = checkedOutDappInfo.dappOrigin;

  const absPath =
    process.platform === 'win32'
      ? unPrefix(checkedOutDappInfo.localFSPath, '/')
      : checkedOutDappInfo.localFSPath;

  if (!fs.existsSync(absPath)) {
    return {
      data: null,
      error: {
        type: DETECT_ERR_CODES.INACCESSIBLE,
        message: `The path doesn't exist.`,
      },
    };
  }
  if (!fs.statSync(absPath).isDirectory()) {
    return {
      data: null,
      error: {
        type: DETECT_ERR_CODES.INACCESSIBLE,
        message: `The path isn't a directory`,
      },
    };
  }
  if (!fs.existsSync(path.resolve(absPath, './index.html'))) {
    return {
      data: null,
      error: {
        type: DETECT_ERR_CODES.INACCESSIBLE,
        message: `The directory doesn't contain index.html`,
      },
    };
  }

  emitIpcMainEvent('__internal_main:app:cache-dapp-id-to-abspath', {
    [checkedOutDappInfo.localFSID]: checkedOutDappInfo.localFSPath,
  });

  let fallbackFavicon: string | undefined;
  let targetMetadata: ISiteMetaData | undefined;
  const { mainSession } = await getSessionInsts();
  const checkResult = await checkUrlViaBrowserView(
    checkedOutDappInfo.dappURLToPrview,
    {
      session: mainSession,
      onMetaDataUpdated: (meta) => {
        fallbackFavicon = pickFavIconURLFromMeta(meta);

        targetMetadata = meta;
      },
      timeout: DFLT_TIMEOUT,
    }
  );

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

  const { origin: finalOrigin } = canoicalizeDappUrl(checkResult.finalUrl);

  const repeatedInputDapp = opts.existedDapps.find(
    (item) => item.origin.toLowerCase() === inputOrigin.toLowerCase()
  );
  const repeatedFinalDapp = opts.existedDapps.find(
    (item) => item.origin.toLowerCase() === finalOrigin.toLowerCase()
  );

  const data: IDappsDetectResult['data'] = {
    preparedDappId: checkedOutDappInfo.dappID,
    inputOrigin,
    isInputExistedDapp: !!repeatedInputDapp,
    finalOrigin,
    isFinalExistedDapp: !!repeatedFinalDapp,
    icon: null,
    recommendedAlias:
      targetMetadata?.og?.site_name ||
      targetMetadata?.og?.title ||
      targetMetadata?.twitter_card?.site ||
      targetMetadata?.twitter_card?.title ||
      targetMetadata?.title ||
      '',
    faviconUrl:
      fallbackFavicon ||
      targetMetadata?.og?.image ||
      targetMetadata?.twitter_card?.image,
    faviconBase64: undefined,
  };

  return {
    data,
    error: undefined,
  };
}

/**
 * @description only ipfs supported now
 */
export async function detectEnsDapp(
  ipfsDappPath: ICheckedOutDappURL | string,
  opts: {
    existedDapps: IDapp[];
  }
): Promise<IDappsDetectResult<DETECT_ERR_CODES>> {
  const checkedOutDappInfo =
    typeof ipfsDappPath === 'string'
      ? checkoutDappURL(ipfsDappPath)
      : ipfsDappPath;
  const inputOrigin = checkedOutDappInfo.dappOrigin;

  const { urlInfo: dappOriginInfo, hostWithoutTLD: inputCoreName } =
    canoicalizeDappUrl(inputOrigin);
  if (dappOriginInfo?.protocol !== PROTOCOL_IPFS) {
    return {
      data: null,
      error: {
        type: DETECT_ERR_CODES.NOT_IPFS,
        message: 'IPFS path should start with ipfs: or /ipfs/',
      },
    };
  }

  const formattedTargetURL = urlFormat(dappOriginInfo);
  let fallbackFavicon: string | undefined;
  let targetMetadata: ISiteMetaData | undefined;
  const { mainSession } = await getSessionInsts();
  const checkResult = await checkUrlViaBrowserView(formattedTargetURL, {
    session: mainSession,
    onMetaDataUpdated: (meta) => {
      fallbackFavicon = pickFavIconURLFromMeta(meta);

      targetMetadata = meta;
    },
    timeout: DFLT_TIMEOUT,
  });

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
        message: 'The ENS domain cannot be accessed.',
      },
    };
  }

  const { origin: finalOrigin } = canoicalizeDappUrl(checkResult.finalUrl);

  const repeatedInputDapp = opts.existedDapps.find(
    (item) => item.origin.toLowerCase() === inputOrigin.toLowerCase()
  );
  const repeatedFinalDapp = opts.existedDapps.find(
    (item) => item.origin.toLowerCase() === finalOrigin.toLowerCase()
  );

  const data: IDappsDetectResult['data'] = {
    inputOrigin,
    isInputExistedDapp: !!repeatedInputDapp,
    finalOrigin,
    isFinalExistedDapp: !!repeatedFinalDapp,
    icon: null,
    recommendedAlias:
      targetMetadata?.og?.site_name ||
      targetMetadata?.og?.title ||
      targetMetadata?.twitter_card?.site ||
      targetMetadata?.twitter_card?.title ||
      targetMetadata?.title ||
      inputCoreName,
    faviconUrl:
      fallbackFavicon ||
      targetMetadata?.og?.image ||
      targetMetadata?.twitter_card?.image,
    faviconBase64: undefined,
  };

  return {
    data,
    error: undefined,
  };
}

export async function detectIPFSDapp(
  ipfsDappPath: ICheckedOutDappURL | string,
  opts: {
    existedDapps: IDapp[];
  }
): Promise<IDappsDetectResult<DETECT_ERR_CODES>> {
  const checkedOutDappInfo =
    typeof ipfsDappPath === 'string'
      ? checkoutDappURL(ipfsDappPath)
      : ipfsDappPath;
  const inputOrigin = checkedOutDappInfo.dappOrigin;

  const { urlInfo: dappOriginInfo, hostWithoutTLD: inputCoreName } =
    canoicalizeDappUrl(inputOrigin);
  if (dappOriginInfo?.protocol !== PROTOCOL_IPFS) {
    return {
      data: null,
      error: {
        type: DETECT_ERR_CODES.NOT_IPFS,
        message: 'IPFS path should start with ipfs: or /ipfs/',
      },
    };
  }

  // const ipfsService = await getIpfsService();
  // const dappEntry = ipfsService.resolveFile(ipfsDappPath);

  // if (!fs.existsSync(dappEntry) || !fs.statSync(dappEntry).isDirectory()) {
  //   return {
  //     data: null,
  //     error: {
  //       type: DETECT_ERR_CODES.INACCESSIBLE,
  //       message: 'IPFS path is not a directory',
  //     },
  //   };
  // }

  const formattedTargetURL = urlFormat(dappOriginInfo);
  let fallbackFavicon: string | undefined;
  let targetMetadata: ISiteMetaData | undefined;
  const { mainSession } = await getSessionInsts();
  const checkResult = await checkUrlViaBrowserView(formattedTargetURL, {
    session: mainSession,
    onMetaDataUpdated: (meta) => {
      fallbackFavicon = pickFavIconURLFromMeta(meta);

      targetMetadata = meta;
    },
    timeout: DFLT_TIMEOUT,
  });

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

  const { origin: finalOrigin } = canoicalizeDappUrl(checkResult.finalUrl);

  const repeatedInputDapp = opts.existedDapps.find(
    (item) => item.origin.toLowerCase() === inputOrigin.toLowerCase()
  );
  const repeatedFinalDapp = opts.existedDapps.find(
    (item) => item.origin.toLowerCase() === finalOrigin.toLowerCase()
  );

  const data: IDappsDetectResult['data'] = {
    inputOrigin,
    isInputExistedDapp: !!repeatedInputDapp,
    finalOrigin,
    isFinalExistedDapp: !!repeatedFinalDapp,
    icon: null,
    recommendedAlias:
      targetMetadata?.og?.site_name ||
      targetMetadata?.og?.title ||
      targetMetadata?.twitter_card?.site ||
      targetMetadata?.twitter_card?.title ||
      targetMetadata?.title ||
      inputCoreName,
    faviconUrl:
      fallbackFavicon ||
      targetMetadata?.og?.image ||
      targetMetadata?.twitter_card?.image,
    faviconBase64: undefined,
  };

  return {
    data,
    error: undefined,
  };
}

export async function detectHttpDapp(
  dappsUrl: string,
  opts: {
    existedDapps: IDapp[];
    proxyOnGrab?: AxiosProxyConfig;
  }
): Promise<IDappsDetectResult<DETECT_ERR_CODES>> {
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
  let targetMetadata: ISiteMetaData | undefined;
  const checkResult = await checkUrlViaBrowserView(formattedTargetURL, {
    onMetaDataUpdated: (meta) => {
      fallbackFavicon = pickFavIconURLFromMeta(meta);

      targetMetadata = meta;
    },
    timeout: DFLT_TIMEOUT,
  });

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
      targetMetadata?.og?.site_name ||
      targetMetadata?.og?.title ||
      targetMetadata?.twitter_card?.site ||
      targetMetadata?.twitter_card?.title ||
      targetMetadata?.title ||
      inputCoreName,
    faviconUrl:
      fallbackFavicon ||
      targetMetadata?.og?.image ||
      targetMetadata?.twitter_card?.image,
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
  // if (!data.faviconUrl) {
  //   const { iconInfo, faviconUrl, faviconBase64 } = await parseWebsiteFavicon(
  //     finalOrigin,
  //     {
  //       timeout: 3000, // 如果之前的流程取不到 favicon，这里大概率也取不到，所以直接 3s 超时即可
  //       proxy: proxyOnGrab,
  //     }
  //   );

  //   data.icon = iconInfo;
  //   data.faviconUrl = faviconUrl || fallbackFavicon;
  //   data.faviconBase64 = faviconBase64;
  // } else if (!data.faviconBase64) {
  //   await fetchImageBuffer(data.faviconUrl, {
  //     timeout: 3000, // base64 非必须，3s 取不到直接超时就好
  //     proxy: proxyOnGrab,
  //   })
  //     .then((faviconBuf) => {
  //       data.faviconBase64 = nativeImage
  //         .createFromBuffer(faviconBuf)
  //         .toDataURL();
  //     })
  //     .catch((error) => {
  //       console.error(`[detectHttpDapp] fetch favicon error occured: `, error);
  //     });
  // }

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

async function getDappIndexHtml(dappOrigin: string) {
  let baseURL = ensurePrefix(dappOrigin, 'https://');
  baseURL = unSuffix(baseURL, '/');

  const request = net.request(`${baseURL}/index.html`);

  return new Promise<string>((resolve, reject) => {
    request.on('response', (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        resolve(data);
      });

      response.on('error', reject);
    });

    request.end();
  });
}

function getSha512(input: string | Buffer) {
  const hash = crypto.createHash('sha512');
  hash.update(input);
  return hash.digest('hex');
}

export async function getDappVersionInfo(dappOrigin: string): Promise<
  IHttpTypeDappVersion & {
    fetchSuccess: boolean;
    cssTagsStringOnDev?: string;
  }
> {
  const result = {
    fetchSuccess: false,
    cssTagsStringOnDev: '',
    versionSha512: '',
    timestamp: 0,
  };

  let html = '';
  try {
    html = await getDappIndexHtml(dappOrigin);
    result.fetchSuccess = true;

    const cssTagsString = extractCssTagsFromHtml(html);

    // if (!IS_RUNTIME_PRODUCTION) result.cssTagsStringOnDev = cssTagsString;

    result.versionSha512 = getSha512(cssTagsString);
    result.timestamp = Date.now();

    Sentry.captureEvent({
      message: 'detected dapp version',
      level: 'info',
      extra: {
        dappOrigin,
        versionSha512: result.versionSha512,
      },
    });
  } catch (err) {
    Sentry.captureException(err);
    return result;
  }

  return result;
}
