/// <reference path="../../isomorphic/types.d.ts" />

import { format as urlFormat } from 'url';
import Axios, { AxiosError } from 'axios';
import LRUCache from 'lru-cache';
import { Subject, firstValueFrom, of } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';

import { canoicalizeDappUrl } from '../../isomorphic/url';
import { parseWebsiteFavicon } from './fetch';
import { AxiosElectronAdapter } from './axios';
import { getSessionInsts } from './stream-helpers';
import { BrowserViewManager } from './browserView';

const DFLT_TIMEOUT = 8 * 1e3;

// eslint-disable-next-line @typescript-eslint/naming-convention
const enum DETECT_ERR_CODES {
  NOT_HTTPS = 'NOT_HTTPS',
  INACCESSIBLE = 'INACCESSIBLE',
  HTTPS_CERT_INVALID = 'HTTPS_CERT_INVALID',
  TIMEOUT = 'TIMEOUT',

  REPEAT = 'REPEAT',
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const enum CHROMIUM_LOADURL_ERR_CODE {
  // https://host.not.existe
  ERR_NAME_NOT_RESOLVED = 'ERR_NAME_NOT_RESOLVED',
  // https://expired.badssl.com
  // https://no-common-name.badssl.com
  // https://no-subject.badssl.com
  // https://incomplete-chain.badssl.com
  ERR_CERT_DATE_INVALID = 'ERR_CERT_DATE_INVALID',
  // https://wrong.host.badssl.com
  ERR_CERT_COMMON_NAME_INVALID = 'ERR_CERT_COMMON_NAME_INVALID',
  // https://self-signed.badssl.com
  // https://untrusted-root.badssl.com
  ERR_CERT_AUTHORITY_INVALID = 'ERR_CERT_AUTHORITY_INVALID',
  // https://revoked.badssl.com
  ERR_CERT_REVOKED = 'ERR_CERT_REVOKED',
}

// eslint-disable-next-line @typescript-eslint/naming-convention
type CHROMIUM_NET_ERR_DESC =
  | `net::${CHROMIUM_LOADURL_ERR_CODE}`
  | `net::ERR_CONNECTION_CLOSED`;

let viewMngr: BrowserViewManager;

async function checkUrlViaBrowserView(
  dappUrl: string,
  opts?: {
    timeout?: number;
  }
) {
  const { checkingViewSession } = await getSessionInsts();
  if (!viewMngr) {
    viewMngr = new BrowserViewManager({
      webPreferences: {
        session: checkingViewSession,
        sandbox: true,
        nodeIntegration: false,
      },
    });
  }
  const view = viewMngr.allocateView(false);

  type Result =
    | {
        valid: true;
        // some website would redirec to another origin, such as https://binance.com -> https://www.binance.com
        finalUrl: string;
      }
    | {
        valid: false;
        isTimeout?: boolean;
        errorDesc?: CHROMIUM_LOADURL_ERR_CODE | string;
        certErrorDesc?: CHROMIUM_NET_ERR_DESC;
      };

  const checkResult = new Subject<Result>();

  view.webContents.on('did-finish-load', () => {
    checkResult.next({
      valid: true,
      finalUrl: view.webContents.getURL(),
    });
    checkResult.complete();
  });

  view.webContents.on(
    'did-fail-load',
    (_, errorCode, errorDesc, validatedURL) => {
      if (errorDesc === CHROMIUM_LOADURL_ERR_CODE.ERR_NAME_NOT_RESOLVED) {
        checkResult.next({
          valid: false,
          errorDesc,
        });
        checkResult.complete();
      } else if (errorDesc.startsWith('ERR_CERT_')) {
        // wait for 'certificate-error' event
      } else {
        checkResult.next({
          valid: false,
          errorDesc,
        });
        checkResult.complete();
      }
    }
  );

  view.webContents.on('certificate-error', (_, url, cert) => {
    checkResult.next({
      valid: false,
      errorDesc: cert.slice('net::'.length),
      certErrorDesc: cert as CHROMIUM_NET_ERR_DESC,
    });
    checkResult.complete();
  });

  view.webContents.loadURL(dappUrl);

  let obs = checkResult.asObservable();
  const { timeout: duration = DFLT_TIMEOUT } = opts || {};
  if (duration && duration > 0) {
    obs = obs.pipe(
      timeout(duration),
      catchError(() =>
        of({
          valid: false as const,
          isTimeout: true,
        })
      )
    );
  }

  return firstValueFrom(obs).finally(() => {
    viewMngr.recycleView(view);
  });
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

export async function detectDapps(
  dappsUrl: string,
  existedDapps: IDapp[]
): Promise<IDappsDetectResult<DETECT_ERR_CODES>> {
  // TODO: process void url;
  const dappOrigin = canoicalizeDappUrl(dappsUrl).origin;
  const { urlInfo: inputUrlInfo } = canoicalizeDappUrl(dappOrigin);

  if (inputUrlInfo?.protocol !== 'https:') {
    return {
      data: null,
      error: {
        type: DETECT_ERR_CODES.NOT_HTTPS,
        message: 'Dapp with protocols other than HTTPS is not supported',
      },
    };
  }

  const formatedUrl = urlFormat(inputUrlInfo);

  const checkResult = await checkUrlViaBrowserView(formatedUrl);
  const isCertErr = !checkResult.valid && !!checkResult.certErrorDesc;

  if (isCertErr) {
    return {
      data: null,
      error: {
        type: DETECT_ERR_CODES.HTTPS_CERT_INVALID,
        message: 'The certificate of the Dapp has expired',
      },
    };
  }
  if (!checkResult.valid) {
    if (checkResult.isTimeout) {
      return {
        data: null,
        error: {
          type: DETECT_ERR_CODES.TIMEOUT,
          message: 'Checking the Dapp timed out, please try again later',
        },
      };
    }

    return {
      data: null,
      error: {
        type: DETECT_ERR_CODES.INACCESSIBLE,
        message: 'This Dapp is inaccessible. It may be an invalid URL',
      },
    };
  }

  const { urlInfo, origin } = canoicalizeDappUrl(checkResult.finalUrl);
  const { iconInfo, faviconUrl, faviconBase64 } = await parseWebsiteFavicon(
    origin,
    { timeout: DFLT_TIMEOUT }
  );

  const repeatedDapp = existedDapps.find((item) => item.origin === origin);

  const data = {
    urlInfo,
    origin,
    icon: iconInfo || null,
    faviconUrl: faviconUrl || undefined,
    faviconBase64: faviconBase64 || undefined,
  };

  if (repeatedDapp) {
    return {
      data,
      error: {
        type: DETECT_ERR_CODES.REPEAT,
        message: 'This Dapp has been added',
      },
    };
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

async function doCheckDappOrigin(origin: string) {
  // TODO: catch error here
  const [httpsCheckResult, latestUpdateResult] = await Promise.all([
    checkDappHttpsCert(origin),
    queryDappLatestUpdateInfo({
      dapp_origin: origin,
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
    origin,
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
  const { origin } = canoicalizeDappUrl(dappUrl);

  let checkResult = securityCheckResults.get(origin);

  if (!checkResult) {
    checkResult = await doCheckDappOrigin(origin);
    securityCheckResults.set(origin, checkResult);
  } else if (options?.updateOnSet) {
    const p = doCheckDappOrigin(origin);

    if (options?.wait) {
      try {
        securityCheckResults.set(origin, await p);
      } catch (e) {
        console.error(e);
      }
    }
  }

  return checkResult;
}
