import { RABBY_INTERNAL_PROTOCOL } from "./constants";

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
export function parseUrlQuery(_url: string) {
  const [url, queryString = ''] = _url.split('?');

  const query: Record<string, any> = parseQueryString(queryString);

  const { pathname } = new URL(url);
  const canoicalPath = pathname.replace(/\/$/, '');

  return { url, canoicalPath, query, queryString };
}

export function integrateQueryToUrl(
  url: string,
  extQuery: Record<string, string>
) {
  const { url: urlWithoutQuery, query: query1 } = parseUrlQuery(url);
  const query = { ...query1, ...extQuery };

  const queryStr2 = new URLSearchParams(query);
  return `${urlWithoutQuery}?${queryStr2}`;
}

export function isRabbyShellURL (url: string) {
  return url.startsWith('chrome-extension://') && url.includes('/shell-webui.html')
}

export function isUrlFromDapp (url: string) {
  return !url.startsWith(RABBY_INTERNAL_PROTOCOL) && !url.startsWith('chrome-extension://')
}

function getRootDomain (hostname: string) {
  const parts = hostname.split('.');

  return parts.length >= 2 ? parts.slice(-2).join('.') : null;
}

export function canoicalizeDappUrl (url: string) {
  let urlInfo: Partial<URL> | null = null;
  try {
    urlInfo = new URL(url);
  } catch (e) {
    urlInfo = null;
  }

  const hostname = urlInfo?.hostname || '';
  const isDapp = urlInfo?.protocol === 'https://';
  const baseURL = isDapp ? `${urlInfo?.protocol}//${hostname}` : null;
  const origin = getRootDomain(hostname) || hostname;

  return {
    isDapp,
    baseURL,
    origin,
  }
}
