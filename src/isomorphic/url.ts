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

export function parseUripath(pathname = window.location.pathname) {
  return pathname.replace(/\/$/, '');
}

/**
 * @description try to parse url, separate url and query
 */
export function parseUrlQuery(_url: string) {
  const [url, queryString = ''] = _url.split('?');

  const query: Record<string, any> = parseQueryString(queryString);

  const { pathname } = new URL(url);
  const canoicalPath = parseUripath(pathname);

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
