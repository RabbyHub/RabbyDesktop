/// <reference path="../../isomorphic/types.d.ts" />

import { Subject, firstValueFrom, of } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import url from 'url';

import { canoicalizeDappUrl } from '../../isomorphic/url';
import { parseWebsiteFavicon } from './fetch';
import { BrowserView } from 'electron';
import { destroyBrowserWebview } from './browser';

const DFLT_TIMEOUT = 8 * 1e3;

const enum DETECT_ERR_CODES {
  NOT_HTTPS = 'NOT_HTTPS',
  INACCESSIBLE = 'INACCESSIBLE',
  HTTPS_CERT_INVALID = 'HTTPS_CERT_INVALID',
  TIMEOUT = 'TIMEOUT',
}

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

type CHROMIUM_NET_ERR_DESC = `net::${CHROMIUM_LOADURL_ERR_CODE}`
  | `net::ERR_CONNECTION_CLOSED`

// TODO: use RxJS to handle multiple events
async function checkUrlViaBrowserView (dappUrl: string, opts?: {
  timeout?: number,
}) {
  const view = new BrowserView({
    webPreferences: {
      sandbox: true,
      nodeIntegration: false,
    }
  })

  type Result = {
    valid: boolean
    isTimeout?: boolean
    errorDesc?: CHROMIUM_LOADURL_ERR_CODE | string
    certErrorDesc?: CHROMIUM_NET_ERR_DESC
  };

  const checkResult = new Subject<Result>();

  view.webContents.on('did-finish-load', () => {
    checkResult.next({
      valid: true
    })
  });

  view.webContents.on('did-fail-load', (_, errorCode, errorDesc, validatedURL) => {
    if (errorDesc === CHROMIUM_LOADURL_ERR_CODE.ERR_NAME_NOT_RESOLVED) {
      checkResult.next({
        valid: false,
        errorDesc: errorDesc
      });
    } else if (errorDesc.startsWith('ERR_CERT_')) {
      // wait for 'certificate-error' event
    } else {
      checkResult.next({
        valid: false,
        errorDesc: errorDesc
      });
    }
  });

  view.webContents.on('certificate-error', (_, url, cert) => {
    checkResult.next({
      valid: false,
      errorDesc: cert.slice('net::'.length),
      certErrorDesc: cert as CHROMIUM_NET_ERR_DESC,
    });
  });

  view.webContents.loadURL(dappUrl);

  let obs = checkResult.asObservable();
  const { timeout: duration = DFLT_TIMEOUT } = opts || {};
  if (duration && duration > 0) {
    obs = obs.pipe(
      timeout(duration),
      catchError(() => of({
        valid: false,
        isTimeout: true,
      }))
    );
  }

  return firstValueFrom(obs).finally(() => {
    checkResult.complete();
    destroyBrowserWebview(view);
  });
}

export async function detectDapps(
  dappsUrl: string
): Promise<IDappsDetectResult<DETECT_ERR_CODES>> {
  // TODO: process void url;
  const { urlInfo, origin } = canoicalizeDappUrl(dappsUrl);

  if (urlInfo?.protocol !== 'https:') {
    return {
      data: null,
      error: {
        type: DETECT_ERR_CODES.NOT_HTTPS,
        message: 'Dapp with protocols other than HTTPS is not supported'
      }
    };
  }

  const formatedUrl = url.format(urlInfo);

  const checkResult = await checkUrlViaBrowserView(formatedUrl);
  const isCertErr = !!checkResult.certErrorDesc;

  if (isCertErr) {
    return {
      data: null,
      error: {
        type: DETECT_ERR_CODES.HTTPS_CERT_INVALID,
        message: 'The certificate of the Dapp has expired'
      }
    };
  } else if (!checkResult.valid) {
    if (checkResult.isTimeout) {
      return {
        data: null,
        error: {
          type: DETECT_ERR_CODES.TIMEOUT,
          message: 'Checking the Dapp timed out, please try again later'
        }
      };
    }

    return {
      data: null,
      error: {
        type: DETECT_ERR_CODES.INACCESSIBLE,
        message: 'This Dapp is inaccessible. It may be an invalid URL'
      }
    };
  }

  const { iconInfo, faviconUrl, faviconBase64 } = await parseWebsiteFavicon(origin);

  return {
    data: {
      urlInfo,
      icon: iconInfo,
      origin,
      faviconUrl,
      faviconBase64
    }
  }
}
