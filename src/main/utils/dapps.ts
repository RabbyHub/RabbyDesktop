/// <reference path="../../isomorphic/types.d.ts" />

import url from 'url';
import { canoicalizeDappUrl } from '../../isomorphic/url';
import { parseWebsiteFavicon } from './fetch';
import { BrowserView } from 'electron';

const enum DETECT_ERR_CODES {
  NOT_HTTPS = 'NOT_HTTPS',
  INACCESSIBLE = 'INACCESSIBLE',
  HTTPS_CERT_INVALID = 'HTTPS_CERT_INVALID',
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

function getInaccessibleResult() {
  return {
    data: null,
    error: {
      type: DETECT_ERR_CODES.INACCESSIBLE,
      message: 'This Dapp is inaccessible. It may be an invalid URL'
    }
  }
};

// TODO: use RxJS to handle multiple events
async function checkUrlViaBrowserView (dappUrl: string) {
  const view = new BrowserView({
    webPreferences: {
      sandbox: true,
      nodeIntegration: false,
    }
  })

  type Result = {
    valid: boolean
    errorDesc?: CHROMIUM_LOADURL_ERR_CODE | string
    certErrorDesc?: CHROMIUM_NET_ERR_DESC
  };

  let res: Result = { valid: false };

  // TODO: add timeout mechanism
  return new Promise<Result>((resolve, reject) => {
    try {
      view.webContents.loadURL(dappUrl);

      view.webContents.on('did-finish-load', () => {
        resolve({
          ...res,
          valid: true
        })
      });

      view.webContents.on('did-fail-load', (_, errorCode, errorDesc, validatedURL) => {
        if (errorDesc === CHROMIUM_LOADURL_ERR_CODE.ERR_NAME_NOT_RESOLVED) {
          resolve({
            valid: false,
            errorDesc: errorDesc
          });
        } else if (errorDesc.startsWith('ERR_CERT_')) {
          // wait for 'certificate-error' event
        } else {
          resolve({
            valid: false,
            errorDesc: errorDesc
          });
        }
      });

      view.webContents.on('certificate-error', (_, url, cert) => {
        resolve({
          valid: false,
          errorDesc: cert.slice('net::'.length),
          certErrorDesc: cert as CHROMIUM_NET_ERR_DESC,
        });
      });
    } catch (e) {
      reject(e);
    }
  }).finally(() => {
    // undocumented behaviors
    (view.webContents as any)?.destroyed?.();
    (view as any)?.destroyed?.();
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
  const isNotFound = checkResult.errorDesc === CHROMIUM_LOADURL_ERR_CODE.ERR_NAME_NOT_RESOLVED;
  const isCertErr = !!checkResult.certErrorDesc;

  if (isCertErr) {
    return {
      data: null,
      error: {
        type: DETECT_ERR_CODES.HTTPS_CERT_INVALID,
        message: 'The certificate of the Dapp has expired'
      }
    };
  } else if (isNotFound) {
    return getInaccessibleResult();
  }

  const { iconInfo, faviconUrl, faviconBase64 } = await parseWebsiteFavicon(origin);
  console.log('[feat] faviconUrl', faviconUrl);

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
