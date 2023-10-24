import http from 'http';
import { BrowserView } from 'electron';
import * as Sentry from '@sentry/electron/main';

import {
  IS_RUNTIME_PRODUCTION,
  RABBY_INTERNAL_PROTOCOL,
} from '@/isomorphic/constants';
import {
  canoicalizeDappUrl,
  formatProxyRules,
  safeParseURL,
} from '@/isomorphic/url';
import { catchError, firstValueFrom, of, Subject, timeout } from 'rxjs';
import { BrowserViewManager, parseSiteMetaByWebContents } from './browserView';
import { getSessionInsts } from './stream-helpers';

const DFLT_TIMEOUT = 8 * 1e3;

// eslint-disable-next-line @typescript-eslint/naming-convention
export const enum CHROMIUM_LOADURL_ERR_CODE {
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

  ERR_NO_SUPPORTED_PROXIES = 'ERR_NO_SUPPORTED_PROXIES',
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export type CHROMIUM_NET_ERR_DESC =
  | `net::${CHROMIUM_LOADURL_ERR_CODE}`
  | `net::ERR_CONNECTION_CLOSED`;

let viewMngr: BrowserViewManager;

const checkingProxyViewReady = getSessionInsts().then(
  ({ checkingProxySession }) => {
    const view = new BrowserView({
      webPreferences: {
        session: checkingProxySession,
        sandbox: true,
        nodeIntegration: false,
        disableDialogs: true,
      },
    });

    return view;
  }
);

export async function checkUrlViaBrowserView(
  targetURL: string,
  opts?: {
    timeout?: number;
    view?: BrowserView;
    session?: Electron.Session;
    onMetaDataUpdated?: (meta: ISiteMetaData) => void;
  }
) {
  const { checkingViewSession } = await getSessionInsts();
  if (!viewMngr) {
    viewMngr = new BrowserViewManager({
      webPreferences: {
        session: checkingViewSession,
        sandbox: true,
        nodeIntegration: false,
        disableDialogs: true,
      },
    });
  }
  const sessionInstance = opts?.session || checkingViewSession;
  const view =
    opts?.view ||
    viewMngr.allocateView({
      webPreferences: {
        session: sessionInstance,
      },
    });

  type Result =
    | {
        valid: true;
        // some website would redirect to another origin, such as https://binance.com -> https://www.binance.com
        finalUrl: string;
        isRedirectedOut?: boolean;
      }
    | {
        valid: false;
        isTimeout?: boolean;
        errorDesc?: CHROMIUM_LOADURL_ERR_CODE | string;
        certErrorDesc?: CHROMIUM_NET_ERR_DESC;
      };

  const checkResult = new Subject<Result>();

  const parsedInputInfo = canoicalizeDappUrl(targetURL);
  const successResult: Result = {
    valid: true,
    finalUrl: '',
    isRedirectedOut: false,
  };
  view.webContents.on('did-redirect-navigation', (_, currentURL) => {
    successResult.isRedirectedOut =
      parsedInputInfo.secondaryDomain !==
      canoicalizeDappUrl(currentURL).secondaryDomain;
  });

  view.webContents.on('did-finish-load', () => {
    checkResult.next({
      ...successResult,
      finalUrl: view.webContents.getURL(),
    });
    checkResult.complete();
  });

  view.webContents.on('dom-ready', () => {
    checkResult.next({
      ...successResult,
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
      } else if (
        errorDesc === CHROMIUM_LOADURL_ERR_CODE.ERR_NO_SUPPORTED_PROXIES
      ) {
        checkResult.next({
          valid: false,
          errorDesc,
        });
        checkResult.complete();
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

  view.webContents.loadURL(targetURL);

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

  return firstValueFrom(obs).finally(async () => {
    opts?.onMetaDataUpdated?.(
      await parseSiteMetaByWebContents(view.webContents)
    );
    viewMngr.recycleView(view);
  });
}

const proxyBypassRules = [
  '<local>',
  `${RABBY_INTERNAL_PROTOCOL}//*`,
  'chrome-extension://*',
  'chrome://*',
  // bypass all websocket like connections to avoid wallet connect v1 issue, but not for v2
  // 'wss://*',
].join(',');

export function setSessionProxy(
  session: Electron.Session,
  conf: IAppProxyConf
) {
  const proxyRules = formatProxyRules(conf.proxySettings);

  session.clearHostResolverCache();

  if (conf.proxyType === 'custom') {
    session.setProxy({
      mode: 'fixed_servers',
      proxyRules: [proxyRules].join(','),
      proxyBypassRules,
    });
  } else if (conf.proxyType === 'system') {
    session.setProxy({
      mode: 'system',
      proxyBypassRules,
    });
  } else {
    session.setProxy({
      proxyRules: '',
      proxyBypassRules,
    });
  }

  return proxyRules;
}

export async function checkProxyViaBrowserView(
  targetURL: string,
  conf: IAppProxyConf
) {
  const view = await checkingProxyViewReady;

  const proxyRules = setSessionProxy(view.webContents.session, conf);

  if (!IS_RUNTIME_PRODUCTION) {
    console.debug(
      `[checkProxyViaBrowserView] targetURL: ${targetURL}; proxyType: ${conf.proxyType}; proxyRules: ${proxyRules}`
    );
  }

  return checkUrlViaBrowserView(targetURL, { view, timeout: 3000 });
}

/**
 * @description
 * TODO: should we cache the result?
 */
export async function isHttpUrlRedirectable(
  httpURL: string
): Promise<string | false> {
  const parsedUrl = safeParseURL(httpURL);

  // TODO: leave here for debug
  // return false;

  if (!parsedUrl) return false;

  if (parsedUrl.protocol === 'https:') {
    return false;
  }
  if (parsedUrl.protocol !== 'http:') {
    return false;
  }

  type IResult = {
    couldRedirect: boolean;
    locationUrl?: string;
    error?: Error;
  };
  const result = await new Promise<IResult>((resolve, reject) => {
    const options = {
      method: 'HEAD',
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname,
      port: parsedUrl.port || 80,
      rejectUnauthorized: false,
    };

    const req = http.request(options, (res) => {
      if (!res?.statusCode) {
        resolve({ couldRedirect: false });
        return;
      }

      if (
        res?.statusCode >= 300 &&
        res?.statusCode < 400 &&
        res.headers.location
      ) {
        try {
          const redirectUrl = new URL(res.headers.location, httpURL);
          if (
            redirectUrl.protocol === 'https:' &&
            redirectUrl.hostname === parsedUrl.hostname
          ) {
            resolve({
              couldRedirect: true,
              locationUrl: redirectUrl.toString(),
            });
          } else {
            resolve({
              couldRedirect: true,
              locationUrl: redirectUrl.toString(),
            });
          }
        } catch (err: any) {
          resolve({ couldRedirect: false, error: err });
        }
      } else {
        resolve({ couldRedirect: false });
      }
    });

    req.on('error', (error) => {
      resolve({ couldRedirect: false, error });
    });

    req.end();
  });

  Sentry.captureEvent({
    message: 'Check If Http Url Redirectable',
    tags: {
      httpURL,
      couldRedirect: result.couldRedirect,
      locationUrl: result.locationUrl,
    },
    extra: {
      error: result.error?.message,
    },
  });

  return result.couldRedirect ? result.locationUrl! : false;
}
