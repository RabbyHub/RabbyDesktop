import { AxiosProxyConfig } from 'axios';
import { RABBY_INTERNAL_PROTOCOL, RABBY_LOCAL_URLBASE } from './constants';

export function parseQueryString(
  input: string = typeof window !== 'undefined'
    ? window.location.search.slice(1)
    : ''
) {
  const result: Record<string, string> = {};
  const queryStr = (input || '').replace(/^[?#&]/, '');

  queryStr
    .trim()
    .split('&')
    .forEach((part) => {
      const [key, value] = part.split('=') || [];
      if (!key) return;

      result[key] = decodeURIComponent(value);
    });
  return result;
}

/**
 * @description try to parse url, separate url and query
 */
function parseUrl(_url: string) {
  const [url, searchStr = ''] = _url.split('?');
  const [queryString, hashFragment = ''] = searchStr.split('#');

  const query: Record<string, any> = parseQueryString(queryString);

  let pathname = '';
  try {
    pathname = new URL(url).pathname;
    // eslint-disable-next-line no-empty
  } catch (e) {}
  const canoicalPath = pathname.replace(/\/$/, '');

  return { url, canoicalPath, query, queryString, hashFragment };
}

export function integrateQueryToUrl(
  url: string,
  extQuery: Record<string, string | number | boolean>
) {
  const { url: urlWithoutQuery, query: query1, hashFragment } = parseUrl(url);
  const query = { ...query1, ...extQuery };

  const queryStr2 = new URLSearchParams(query);
  return [
    `${urlWithoutQuery}?${queryStr2}`,
    hashFragment ? `#${hashFragment}` : '',
  ].join('');
}

export function isRabbyShellURL(url: string) {
  return url.startsWith('chrome-extension://') && url.includes('/webui.html');
}

export function isRabbyXPage(
  url: string,
  extid: string,
  type: 'background' | 'notification'
) {
  switch (type) {
    default:
    case 'notification':
      return url.startsWith(`chrome-extension://${extid}/notification.html`);
    case 'background':
      return (
        url.startsWith(`chrome-extension://${extid}/background.html`) ||
        url.startsWith(
          `chrome-extension://${extid}/_generated_background_page.html`
        )
      );
  }
}

const HARDWARE_CONNECT = [
  // onekey
  {
    type: 'onekey',
    urls: ['https://connect.onekey.so/popup.html'],
  },
  {
    type: 'trezor',
    urls: [
      'https://connect.trezor.io/8/popup.html',
      'https://connect.trezor.io/9/popup.html',
    ],
  },
] as const;

export function checkHardwareConnectPage(url: string) {
  const connInfo = HARDWARE_CONNECT.find((info) =>
    info.urls.some((u) => url.startsWith(u))
  );

  return connInfo || false;
}

export function isUrlFromDapp(url: string) {
  return (
    !url.startsWith(RABBY_INTERNAL_PROTOCOL) &&
    !url.startsWith('chrome-extension:') &&
    url.startsWith('https:')
  );
}

// TODO: use better flag to check if it's main window's shell ui
export function isMainWinShellWebUI(url: string) {
  return (
    url.startsWith('chrome-extension:') &&
    url.includes('__webuiIsMainWindow=true')
  );
}
export function isForTrezorLikeWebUI(url: string) {
  return (
    url.startsWith('chrome-extension:') &&
    url.includes('__webuiForTrezorLike=true')
  );
}

function _isBuiltinView(url: string, viewType: IBuiltinViewName | '*') {
  const urlInfo = new URL(url);
  const queryInfo = parseQueryString(urlInfo.search);

  switch (viewType) {
    case 'main-window':
      return isMainWinShellWebUI(url);
    case 'address-management':
    case 'add-address':
    case 'z-popup':
      return (
        url.startsWith('chrome-extension:') &&
        urlInfo.pathname === '/popup-view.html' &&
        queryInfo.view === `${viewType}`
      );
    case 'dapps-management':
      return (
        url.startsWith(RABBY_LOCAL_URLBASE) &&
        urlInfo.pathname === '/popup-view.html' &&
        queryInfo.view === `${viewType}`
      );
    default:
      return false;
  }
}

export function isBuiltinView(url: string, viewType: IBuiltinViewName | '*') {
  switch (viewType) {
    default:
      return _isBuiltinView(url, viewType);
    case '*':
      return (
        [
          'main-window',
          'address-management',
          'add-address',
          'dapps-management',
          'z-popup',
          // 'select-devices'
        ] as IBuiltinViewName[]
      ).some((view) => _isBuiltinView(url, view));
  }
}

export function isRabbyXNotificationWinShellWebUI(url: string) {
  return (
    url.startsWith('chrome-extension:') &&
    url.includes('__webuiIsRabbyXNotificationWindow=true')
  );
}

export function isDappProtocol(protocolOrUrl: string) {
  return protocolOrUrl.startsWith('https:');
}

export function getDomainFromHostname(hostname: string) {
  const parts = hostname.split('.');
  const secondaryDomainParts = parts.slice(parts.length - 2);
  const secondaryDomain = secondaryDomainParts.join('.');

  return {
    hostWithoutTLD: secondaryDomainParts[0],
    secondaryDomain,
    secondaryOrigin: `https://${secondaryDomain}`,
    is2ndaryDomain: parts.length === 2 && secondaryDomain === hostname,
    isSubDomain: parts.length > 2,
  };
}

export function isInternalProtocol(url: string) {
  return [
    `${RABBY_INTERNAL_PROTOCOL}//`,
    'chrome-extension://',
    'chrome://',
  ].some((protocol) => url.startsWith(protocol));
}

export function canoicalizeDappUrl(url: string) {
  let urlInfo: Partial<URL> | null = null;
  try {
    urlInfo = new URL(url);
  } catch (e) {
    urlInfo = null;
  }

  const hostname = urlInfo?.hostname || '';
  const isDapp = urlInfo?.protocol === 'https:';

  // protcol://hostname[:port]
  const origin =
    urlInfo?.origin ||
    `${urlInfo?.protocol}//${hostname}${
      urlInfo?.port ? `:${urlInfo?.port}` : ''
    }`;

  const domainInfo = getDomainFromHostname(hostname);

  return {
    urlInfo,
    isDapp,
    origin,
    hostname,
    ...domainInfo,
  };
}

export function parseDomainMeta(
  urlOrigin: string,
  inputOrigins: (string | { origin: string })[] | Set<string>,
  retCache: Record<I2ndDomainMeta['secondaryDomain'], I2ndDomainMeta>
) {
  const allOrigins = Array.from(inputOrigins);

  const parsed = canoicalizeDappUrl(urlOrigin);

  if (!retCache[parsed.secondaryDomain]) {
    const record: I2ndDomainMeta = {
      secondaryDomain: parsed.secondaryDomain,
      origin: parsed.origin,
      is2ndaryDomain: parsed.is2ndaryDomain,
      subDomains: [],
    };

    allOrigins.forEach((dO) => {
      const dappOrigin = typeof dO === 'string' ? dO : dO.origin;
      const originInfo = canoicalizeDappUrl(dappOrigin);
      if (originInfo.secondaryDomain !== record.secondaryDomain) return;
      if (
        !originInfo.is2ndaryDomain &&
        !record.subDomains.includes(originInfo.hostname)
      ) {
        record.subDomains.push(originInfo.hostname);
      }
    });

    retCache[parsed.secondaryDomain] = record;
  }

  return retCache[parsed.secondaryDomain];
}

export function parseOrigin(url: string) {
  return canoicalizeDappUrl(url).origin;
}

export const getOriginFromUrl = (url: string) => {
  return canoicalizeDappUrl(url).origin;
};

export const getMainDomain = (url: string) => {
  return canoicalizeDappUrl(url).secondaryDomain;
};

export function getBaseHref(url: string) {
  const urlInfo = new URL(url);

  urlInfo.hash = '';
  urlInfo.search = '';

  return urlInfo.toString();
}

export function hasSameOrigin(url1: string, url2: string) {
  return canoicalizeDappUrl(url1).origin === canoicalizeDappUrl(url2).origin;
}

function removeOptionalTrailingDot(str: string, allowTrailingDot: boolean) {
  if (allowTrailingDot && str[str.length - 1] === '.') {
    return str.substring(0, str.length - 1);
  }

  return str;
}

/**
 * @see https://github.com/parro-it/is-fqdn/blob/master/index.js
 */
export function isFQDN(
  _str: string,
  { requireTld = true, allowUnderscores = false, allowTrailingDot = false } = {}
) {
  if (typeof _str !== 'string') {
    return false;
  }

  const str = removeOptionalTrailingDot(_str, allowTrailingDot);
  const parts = str.split('.');

  if (requireTld) {
    const tld = parts.pop();
    if (!tld) return false;
    if (
      !parts.length ||
      !/^([a-z\u00a1-\uffff]{2,}|xn[a-z0-9-]{2,})$/i.test(tld)
    ) {
      return false;
    }
  }

  for (let part: string, i = 0; i < parts.length; i++) {
    part = parts[i];
    if (allowUnderscores) {
      if (part.indexOf('__') >= 0) {
        return false;
      }
      part = part.replace(/_/g, '');
    }
    if (!/^[a-z\u00a1-\uffff0-9-]+$/i.test(part)) {
      return false;
    }
    if (/[\uff01-\uff5e]/.test(part)) {
      // disallow full-width chars
      return false;
    }
    if (part[0] === '-' || part[part.length - 1] === '-') {
      return false;
    }
  }
  return true;
}

export function filterProxyProtocol(
  input: IAppProxyConf['proxySettings']['protocol'] & any
) {
  switch (input) {
    default:
    case 'http':
    case 'http:':
      return 'http';
    case 'socks5':
    case 'socks5:':
      return 'socks5';
  }
}

export function formatProxyServerURL(settings: IAppProxyConf['proxySettings']) {
  return `${filterProxyProtocol(settings.protocol)}://${settings.hostname}:${
    settings.port
  }`;
}

export function formatProxyRules(settings: IAppProxyConf['proxySettings']) {
  const fixedServer = formatProxyServerURL(settings);

  return [fixedServer, 'direct://'].join(',');
}

export function formatAxiosProxyConfig(conf: AxiosProxyConfig) {
  return `${filterProxyProtocol(conf.protocol)}://${conf.host}:${conf.port}`;
}

export function coercePort(input: any) {
  let result = Number.parseInt(input, 10);
  if (Number.isNaN(result)) {
    result = 80;
  }

  return result || 80;
}
