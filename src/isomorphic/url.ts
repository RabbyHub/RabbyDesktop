import { AxiosProxyConfig } from 'axios';
import {
  IPFS_LOCALHOST_DOMAIN,
  LOCALIPFS_BRAND,
  RABBY_INTERNAL_PROTOCOL,
  RABBY_LOCAL_URLBASE,
} from './constants';

export function safeParseURL(url: string): URL | null {
  try {
    return new URL(url);
  } catch (e) {
    return null;
  }
}

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
  type?: 'background' | 'notification'
) {
  switch (type) {
    default:
      return url.startsWith(`chrome-extension://${extid}`);
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

export function isExtensionBackground(url: string) {
  const urlInfo = safeParseURL(url);
  return (
    urlInfo?.protocol === 'chrome-extension:' &&
    urlInfo.pathname === '/background.html'
  );
}

const TREZOR_LIKE_CONNECT = [
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
  const connInfo = TREZOR_LIKE_CONNECT.find((info) =>
    info.urls.some((u) => url.startsWith(u))
  );

  return connInfo || false;
}

export function isUrlFromDapp(url: string) {
  return (
    !url.startsWith(RABBY_INTERNAL_PROTOCOL) &&
    !url.startsWith('chrome-extension:') &&
    (url.startsWith('https:') ||
      // ipfs support
      (url.startsWith('http:') && url.includes(`.${IPFS_LOCALHOST_DOMAIN}`)) ||
      (url.startsWith('http:') && url.includes(`${LOCALIPFS_BRAND}.`)))
  );
}

export function getShellUIType(url: string) {
  return parseQueryString(new URL(url).search).__webuiType;
}

// TODO: use better flag to check if it's main window's shell ui
export function isMainWinShellWebUI(url: string) {
  return (
    url.startsWith('chrome-extension:') &&
    url.includes('__webuiType=MainWindow')
  );
}
export function isForTrezorLikeWebUI(url: string) {
  return (
    url.startsWith('chrome-extension:') &&
    url.includes('__webuiType=ForTrezorLike')
  );
}

export function maybeTrezorLikeBuiltInHttpPage(url: string) {
  // const urlInfo = new URL(url);

  return checkHardwareConnectPage(url);
  // || urlInfo.hostname.includes('onekey.so')// onekey
  // || urlInfo.hostname.includes('trezor.io') // trezor
}

function _isBuiltinView(url: string, viewType: IBuiltinViewName | '*') {
  const urlInfo = new URL(url);
  const queryInfo = parseQueryString(urlInfo.search);

  switch (viewType) {
    case 'main-window':
      return isMainWinShellWebUI(url);
    case 'add-address-dropdown':
    case 'z-popup':
      return (
        url.startsWith('chrome-extension:') &&
        urlInfo.pathname === '/popup-view.html' &&
        queryInfo.view === `${viewType}`
      );
    case 'dapps-management':
    case 'global-toast-popup':
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
          'add-address-dropdown',
          'dapps-management',
          'z-popup',
          'global-toast-popup',
          // 'select-devices'
        ] as IBuiltinViewName[]
      ).some((view) => _isBuiltinView(url, view));
  }
}

export function isRabbyXNotificationWinShellWebUI(url: string) {
  return (
    url.startsWith('chrome-extension:') &&
    url.includes('__webuiType=RabbyX-NotificationWindow')
  );
}

export function isDappProtocol(protocolOrUrl: string) {
  return protocolOrUrl.startsWith('https:');
}

export function getDomainFromHostname(hostname: string): IParseDomainInfo {
  const parts = hostname.split('.');
  const secondaryDomainParts = parts.slice(parts.length - 2);
  const secondaryDomain = secondaryDomainParts.join('.');

  return {
    subDomain: parts.slice(0, parts.length - 2).join('.'),
    hostWithoutTLD: secondaryDomainParts[0],
    tld: secondaryDomainParts[1],
    secondaryDomain,
    secondaryOrigin: `https://${secondaryDomain}`,
    is2ndaryDomain: parts.length === 2 && secondaryDomain === hostname,
    isWWWSubDomain: parts.length === 3 && parts[0] === 'www',
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

export const IPFS_REGEXPS = {
  IPFS_REGEX: /^(?:ipfs|rabby-ipfs):\/\/([a-zA-Z0-9]+)(\/.*)?$/i,
  LOCALIPFS_BRAND_REGEX: /^http:\/\/local.ipfs\.([a-zA-Z0-9]+)(\/.*)?$/i,
  LOCALIPFS_MAINDOMAIN_REGEX: /^http:\/\/([a-zA-Z0-9]+)\.local\.ipfs(\/.*)?$/i,
};

export function extractIpfsCid(ipfsDappPath: string) {
  if (ipfsDappPath.startsWith('/ipfs/')) {
    return ipfsDappPath.split('/')[2] || '';
  }

  if (
    ipfsDappPath.startsWith('rabby-ipfs:') ||
    ipfsDappPath.startsWith('ipfs:')
  ) {
    const [, ipfsCid = ''] = ipfsDappPath.match(IPFS_REGEXPS.IPFS_REGEX) || [];

    return ipfsCid;
  }

  if (IPFS_REGEXPS.LOCALIPFS_MAINDOMAIN_REGEX.test(ipfsDappPath)) {
    return (
      ipfsDappPath.match(IPFS_REGEXPS.LOCALIPFS_MAINDOMAIN_REGEX)?.[1] || ''
    );
  }

  if (IPFS_REGEXPS.LOCALIPFS_BRAND_REGEX.test(ipfsDappPath)) {
    return ipfsDappPath.match(IPFS_REGEXPS.LOCALIPFS_BRAND_REGEX)?.[1] || '';
  }

  return '';
}

export function isIpfsHttpURL(dappURL: string) {
  return (
    IPFS_REGEXPS.LOCALIPFS_MAINDOMAIN_REGEX.test(dappURL) ||
    IPFS_REGEXPS.LOCALIPFS_BRAND_REGEX.test(dappURL)
  );
}

export function canoicalizeDappUrl(url: string): ICanonalizedUrlInfo {
  const urlInfo: Partial<URL> | null = safeParseURL(url);

  const hostname = urlInfo?.hostname || '';
  const isDapp =
    !!urlInfo?.protocol &&
    ['https:', 'ipfs:', 'rabby-ipfs:'].includes(urlInfo?.protocol);

  const origin = ['ipfs:', 'rabby-ipfs:'].includes(urlInfo?.protocol || '')
    ? `rabby-ipfs://${extractIpfsCid(url)}`
    : urlInfo?.origin ||
      `${urlInfo?.protocol}//${hostname}${
        urlInfo?.port ? `:${urlInfo?.port}` : ''
      }`;

  const domainInfo = getDomainFromHostname(hostname);

  return {
    urlInfo,
    isDapp,
    origin,
    hostname,
    fullDomain: urlInfo?.host || '',
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
      secondaryDomainOriginExisted: false,
      subDomains: [],
    };

    allOrigins.forEach((dO) => {
      const dappOrigin = typeof dO === 'string' ? dO : dO.origin;
      const originInfo = canoicalizeDappUrl(dappOrigin);
      if (originInfo.secondaryDomain !== record.secondaryDomain) return;

      if (originInfo.is2ndaryDomain) {
        record.secondaryDomainOriginExisted = true;
      } else if (!record.subDomains.includes(originInfo.hostname)) {
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

export function getBuiltinViewType(urlInfo: URL | Location) {
  if (urlInfo.protocol === 'chrome-extension:') {
    return 'chrome-extension';
  }
  if (
    RABBY_INTERNAL_PROTOCOL === urlInfo.protocol ||
    urlInfo.href.startsWith(RABBY_LOCAL_URLBASE)
  ) {
    return 'rabby-internal';
  }

  return false;
}
