import { canoicalizeDappUrl, safeParseURL } from './url';

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

export function matchURLHeadV2(
  inputURL?: string,
  url_head?: (IAppDynamicConfig['domain_metas'] & object)['url_head']
) {
  if (!inputURL) return;
  if (!url_head) return;

  const urlInfo = canoicalizeDappUrl(inputURL);
  if (!urlInfo?.secondaryDomain) return;

  const result: {
    urlConfByHostname: typeof url_head[any] | null;
    urlConfByMainDomain: typeof url_head[any] | null;
    finalMatchedConf: typeof url_head[any] | null;
  } = {
    urlConfByHostname: null,
    urlConfByMainDomain: null,
    finalMatchedConf: null,
  };

  Object.keys(url_head).find((urlHead) => {
    if (urlInfo.hostname === urlHead) {
      result.urlConfByHostname = url_head[urlHead];
    } else if (urlInfo.secondaryDomain === urlHead) {
      result.urlConfByMainDomain = url_head[urlHead];
    }

    return result.urlConfByHostname || result.urlConfByMainDomain;
  });

  result.finalMatchedConf =
    result.urlConfByHostname || result.urlConfByMainDomain;

  return result;
}
