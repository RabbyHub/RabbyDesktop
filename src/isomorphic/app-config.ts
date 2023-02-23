import { safeParseURL } from './url';

export function matchURLHead(
  inputURL?: string,
  url_head?: (IAppDynamicConfig['domain_metas'] & object)['url_head']
) {
  if (!inputURL) return;
  if (!url_head) return;

  const urlInfo = safeParseURL(inputURL);
  if (!urlInfo?.hostname) return;

  let urlConfByHead: typeof url_head[any] | null =
    url_head[urlInfo.hostname] || null;

  if (!urlConfByHead) {
    urlConfByHead =
      Object.entries(url_head).find(([urlHead]) => {
        const urlHeadInfo = safeParseURL(urlHead);
        if (!urlHeadInfo?.hostname) return;

        return `${urlHeadInfo?.hostname}${urlHeadInfo?.pathname}`.startsWith(
          urlHead
        );
      })?.[1] || null;
  }

  return urlConfByHead;
}
