import { RABBY_INTERNAL_PROTOCOL } from './constants';

export function parseQueryString(input?: string) {
  const result: Record<string, string> = {};
  const queryStr =
    (typeof window !== 'undefined' ? window.location.search.slice(1) : input) ||
    '';

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

export function isRabbyExtBackgroundPage(url: string, extid: string) {
  return url.startsWith(`chrome-extension://${extid}/background.html`);
}

export function isUrlFromDapp(url: string) {
  return (
    !url.startsWith(RABBY_INTERNAL_PROTOCOL) &&
    !url.startsWith('chrome-extension:') &&
    url.startsWith('https:')
  );
}

export function isInternalTabUrl(url: string) {
  return url.startsWith(RABBY_INTERNAL_PROTOCOL);
}

// TODO: use better flag to check if it's main window's shell ui
export function isMainWinShellWebUI(url: string) {
  return (
    url.startsWith('chrome-extension:') &&
    url.includes('__webuiIsMainWindow=true')
  );
}

export function isDappProtocol(protocolOrUrl: string) {
  return protocolOrUrl.startsWith('https:');
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
  const domain = hostname.split('.').slice(-2).join('.');

  return {
    urlInfo,
    isDapp,
    origin,
    domain,
  };
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
