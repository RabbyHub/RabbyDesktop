export function parseQueryString(input?: string) {
  const result: Record<string, string> = {}
  const queryStr = (typeof window !== 'undefined' ? window.location.search.slice(1) : input) || ''

  queryStr.trim().split('&').forEach((part) => {
    const [key, value] = part.split('=') || []
    if (!key) return ;

    result[key] = decodeURIComponent(value)
  })
  return result
}

/**
 * @description try to parse url, separate url and query
 */
export function parseUrlQuery (url: string) {
  let queryString = '';
  let query: Record<string, any> = {};

  [url, queryString] = url.split('?');
  queryString = queryString || '';

  query = parseQueryString(queryString);

  const { pathname } = new URL(url);
  const canoicalPath = parseUripath(pathname);

  return { url, canoicalPath, query, queryString };
}

export function integrateQueryToUrl (url: string, extQuery: Record<string, string>) {
  let { url: urlWithoutQuery, query } = parseUrlQuery(url);
  query = { ...query, ...extQuery };

  const queryStr2 = new URLSearchParams(query);
  return `${urlWithoutQuery}?${queryStr2}`;
}

export function parseUripath (pathname = window.location.pathname) {
  return pathname.replace(/\/$/, '');
}
