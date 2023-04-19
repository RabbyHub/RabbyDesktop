import { PROTOCOL_ENS, PROTOCOL_IPFS } from './constants';
import { ensurePrefix } from './string';
import {
  canoicalizeDappUrl,
  extractIpfsCid,
  extractIpfsInfo,
  isIpfsHttpURL,
} from './url';

/**
 * @deprecated
 */
function extractIpfsPathname(requestURL: string) {
  let specialProtocol = '';
  if (requestURL.startsWith(PROTOCOL_IPFS)) {
    specialProtocol = PROTOCOL_IPFS;
  } else if (requestURL.startsWith(PROTOCOL_ENS)) {
    specialProtocol = PROTOCOL_ENS;
  }
  if (specialProtocol) {
    const pathnameWithQuery = requestURL.slice(`${specialProtocol}//`.length);
    if (specialProtocol === PROTOCOL_ENS) {
      return requestURL.slice(`${specialProtocol}//`.length);
    }

    const pathname = pathnameWithQuery.split('?')?.[0] || '';
    const pathnameWithoutHash = pathname.split('#')?.[0] || '';

    const ipfsCid = extractIpfsInfo(requestURL);
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

  const { ipfsCid, pathnameWithQuery } = extractIpfsInfo(httpURL);

  return `${PROTOCOL_IPFS}//${ipfsCid}${pathnameWithQuery}`;
}
