import { PROTOCOL_IPFS } from './constants';
import { extractIpfsInfo, isIpfsHttpURL } from './url';

export function covertIpfsHttpToRabbyIpfs(httpURL: string) {
  if (!isIpfsHttpURL(httpURL)) return httpURL;

  const { ipfsCid, pathnameWithQuery } = extractIpfsInfo(httpURL);

  return `${PROTOCOL_IPFS}//${ipfsCid}${pathnameWithQuery}`;
}
