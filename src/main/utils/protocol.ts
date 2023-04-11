import fs from 'fs';
import path from 'path';

import {
  IS_RUNTIME_PRODUCTION,
  PROTOCOL_IPFS,
  RABBY_INTERNAL_PROTOCOL,
} from '@/isomorphic/constants';
import { ensurePrefix } from '@/isomorphic/string';
import {
  canoicalizeDappUrl,
  extractIpfsCid,
  isIpfsHttpURL,
} from '@/isomorphic/url';
import { arraify } from '@/isomorphic/array';
import { getBindLog } from './log';
import { getIpfsService } from './stream-helpers';
import { rewriteIpfsHtmlFile } from './file';
import { getAssetPath, getRendererPath } from './app';

const protocolLog = getBindLog('session', 'bgGrey');

export function checkoutCustomSchemeHandlerInfo(
  tProtocol: string,
  requestURL: string
) {
  if (tProtocol === 'http:') {
    // it's http://local.ipfs.<cid>
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

type IRegisterProtocolSessionDesc = { session: Electron.Session; name: string };
type IRegisterProtocolHandler<
  T extends IRegisterProtocolSessionDesc = IRegisterProtocolSessionDesc
> = (sessionDesc: T) => {
  protocol: string;
  registerSuccess: boolean;
};
export function registerSessionProtocol<T extends IRegisterProtocolSessionDesc>(
  inputSessions: T | T[],
  handler: IRegisterProtocolHandler<T>
) {
  const sessions = arraify(inputSessions);

  sessions.forEach((ctx) => {
    const { registerSuccess, protocol: registeredProtocol } = handler({
      ...ctx,
    });

    if (!registerSuccess) {
      if (!IS_RUNTIME_PRODUCTION) {
        throw new Error(
          `[registerSessionProtocol][session:${ctx.name}] Failed to register protocol ${registeredProtocol}`
        );
      } else {
        console.error(
          `[registerSessionProtocol][session:${ctx.name}] Failed to register protocol ${registeredProtocol}`
        );
      }
    } else {
      protocolLog(
        `[registerSessionProtocol][session:${ctx.name}] registered protocol ${registeredProtocol} success`
      );
    }
  });
}

// export const interpreteRabbyInternal: IRegisterProtocolHandler = (ctx) => {
export const appInterpretors = {
  [RABBY_INTERNAL_PROTOCOL]: <IRegisterProtocolHandler>((ctx) => {
    const registerSuccess = ctx.session.protocol.registerFileProtocol(
      RABBY_INTERNAL_PROTOCOL.slice(0, -1),
      (request, callback) => {
        const pathnameWithQuery = request.url.slice(
          `${RABBY_INTERNAL_PROTOCOL}//`.length
        );

        const pathname = pathnameWithQuery.split('?')?.[0] || '';
        const pathnameWithoutHash = pathname.split('#')?.[0] || '';

        if (pathnameWithoutHash.startsWith('assets/')) {
          callback({
            path: getAssetPath(pathnameWithoutHash.slice('assets/'.length)),
          });
        } else if (pathnameWithoutHash.startsWith('local/')) {
          callback({
            path: getRendererPath(pathnameWithoutHash.slice('local/'.length)),
          });
        } else {
          // TODO: give one 404 page
          callback({
            data: 'Not found',
            mimeType: 'text/plain',
          });
        }
      }
    );

    return { registerSuccess, protocol: RABBY_INTERNAL_PROTOCOL };
  }),
  'http:': <IRegisterProtocolHandler>((ctx) => {
    const TARGET_PROTOCOL = 'http:';
    // const unregistered = protocol.unregisterProtocol(TARGET_PROTOCOL.slice(0, -1));
    // console.log(`unregistered: ${TARGET_PROTOCOL}`, unregistered);

    const registerSuccess = ctx.session.protocol.interceptFileProtocol(
      TARGET_PROTOCOL.slice(0, -1),
      async (request, callback) => {
        if (!isIpfsHttpURL(request.url)) {
          // protocol.uninterceptProtocol('http');
          callback({
            data: 'Not found',
            mimeType: 'text/plain',
            statusCode: 404,
          });
          return;
        }

        const checkouted = checkoutCustomSchemeHandlerInfo(
          TARGET_PROTOCOL,
          request.url
        );
        if (!checkouted) {
          callback({
            data: 'Not found',
            mimeType: 'text/plain',
            statusCode: 404,
          });
          return;
        }

        const { fileRelPath } = checkouted;

        const ipfsService = await getIpfsService();

        let filePath = ipfsService.resolveFile(fileRelPath);

        if (!fs.existsSync(filePath)) {
          callback({
            data: 'Not found',
            mimeType: 'text/plain',
            statusCode: 404,
          });
          return;
        }

        if (fs.statSync(filePath).isDirectory()) {
          filePath = path.join(filePath, './index.html');
          filePath = rewriteIpfsHtmlFile(filePath);
        }

        if (!fs.existsSync(filePath)) {
          callback({
            data: 'Not found',
            mimeType: 'text/plain',
            statusCode: 404,
          });
          return;
        }

        callback({ path: filePath });
      }
    );

    return { registerSuccess, protocol: TARGET_PROTOCOL };
  }),
  [PROTOCOL_IPFS]: <IRegisterProtocolHandler>((ctx) => {
    const registerSuccess = ctx.session.protocol.registerFileProtocol(
      PROTOCOL_IPFS.slice(0, -1),
      async (request, callback) => {
        const pathnameWithQuery = request.url.slice(
          `${PROTOCOL_IPFS}//`.length
        );

        const pathname = pathnameWithQuery.split('?')?.[0] || '';
        const pathnameWithoutHash = pathname.split('#')?.[0] || '';

        const ipfsService = await getIpfsService();
        let filePath = ipfsService.resolveFile(pathnameWithoutHash);

        if (!fs.existsSync(filePath)) {
          callback({ data: 'Not found', mimeType: 'text/plain' });
          return;
        }

        if (fs.statSync(filePath).isDirectory()) {
          filePath = path.join(filePath, './index.html');
          filePath = rewriteIpfsHtmlFile(filePath);
        }

        if (!fs.existsSync(filePath)) {
          callback({ data: 'Not found', mimeType: 'text/plain' });
          return;
        }

        callback({
          path: filePath,
        });
      }
    );

    return { registerSuccess, protocol: PROTOCOL_IPFS };
  }),
} as const;
