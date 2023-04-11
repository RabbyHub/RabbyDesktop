import { PROTOCOL_IPFS } from './constants';
import { ensurePrefix } from './string';
import { canoicalizeDappUrl, extractIpfsCid, isIpfsHttpURL } from './url';

export function extractIpfsPathname(requestURL: string) {
  if (requestURL.startsWith(PROTOCOL_IPFS)) {
    const pathnameWithQuery = requestURL.slice(`${PROTOCOL_IPFS}//`.length);

    const pathname = pathnameWithQuery.split('?')?.[0] || '';
    const pathnameWithoutHash = pathname.split('#')?.[0] || '';

    const ipfsCid = extractIpfsCid(requestURL);
    const fsRelativePath = ensurePrefix(
      pathnameWithoutHash,
      `ipfs/${ipfsCid}/`
    );

    return {
      ipfsCid,
      pathnameWithQuery,
      pathname,
      pathnameWithoutHash,
      fsRelativePath,
    };
  }

  const parsedInfo = canoicalizeDappUrl(requestURL);
  const pathnameWithQuery = parsedInfo.urlInfo?.pathname || '';

  const pathname = pathnameWithQuery.split('?')?.[0] || '';
  const pathnameWithoutHash = pathname.split('#')?.[0] || '';

  const ipfsCid = extractIpfsCid(requestURL);
  const fsRelativePath = ensurePrefix(pathnameWithoutHash, `ipfs/${ipfsCid}/`);

  return {
    ipfsCid,
    pathnameWithQuery,
    pathname,
    pathnameWithoutHash,
    fsRelativePath,
  };
}

export function covertIpfsHttpToRabbyIpfs(httpURL: string) {
  if (!isIpfsHttpURL(httpURL)) return httpURL;

  const { ipfsCid, pathnameWithQuery } = extractIpfsPathname(httpURL);

  return `${PROTOCOL_IPFS}//${ipfsCid}${pathnameWithQuery}`;
}
