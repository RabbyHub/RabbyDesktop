import { ensurePrefix } from '@/isomorphic/string';
import { canoicalizeDappUrl, extractIpfsCid } from '@/isomorphic/url';

export function checkoutCustomSchemeHandlerInfo(
  tProtocol: string,
  requestURL: string
) {
  if (tProtocol === 'http:') {
    // it's http://localipfs.<cid>
    const parsedInfo = canoicalizeDappUrl(requestURL);
    const pathnameWithQuery = parsedInfo.urlInfo?.pathname || '';

    const pathname = pathnameWithQuery.split('?')?.[0] || '';
    const pathnameWithoutHash = pathname.split('#')?.[0] || '';

    const ipfsCid = extractIpfsCid(requestURL);
    const fileRelPath = ensurePrefix(pathnameWithoutHash, `ipfs/${ipfsCid}/`);

    return {
      ipfsCid,
      fileRelPath,
    };
  } // it's file://ipfs.<cid>/..., we don't support it yet.
  const pathnameWithQuery = requestURL.slice(`${tProtocol}//`.length);

  const pathname = pathnameWithQuery.split('?')?.[0] || '';
  const pathnameWithoutHash = pathname.split('#')?.[0] || '';

  const [urlOrigin, ...restParts] = pathnameWithoutHash.split('/');

  const ipfsCid = urlOrigin.split('.').slice(-1)[0];

  const fileRelPath = ensurePrefix(restParts.join('/'), `${ipfsCid}/`);

  return {
    ipfsCid,
    fileRelPath,
  };

  return null;
}
