import fs from 'fs';
import path from 'path';

import logger from 'electron-log';

import {
  IS_RUNTIME_PRODUCTION,
  PROTOCOL_ENS,
  PROTOCOL_IPFS,
  RABBY_INTERNAL_PROTOCOL,
} from '@/isomorphic/constants';
import { ensurePrefix } from '@/isomorphic/string';
import {
  canoicalizeDappUrl,
  extractIpfsCid,
  extractIpfsInfo,
  isIpfsHttpURL,
  splitPathname,
} from '@/isomorphic/url';
import { arraify } from '@/isomorphic/array';
import { checkoutDappURL } from '@/isomorphic/dapp';
import { getBindLog } from './log';
import { getIpfsService } from './stream-helpers';
import { rewriteIpfsHtmlFile } from './file';
import { getAssetPath, getRendererPath } from './app';
import { findDappsById } from '../store/dapps';

const protocolLog = getBindLog('session', 'bgGrey');

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
        const checkedOutDappURLInfo = checkoutDappURL(request.url);

        const { pathnameWithQuery } = extractIpfsInfo(request.url);
        const dapp = findDappsById(checkedOutDappURLInfo.dappID);

        if (!dapp) {
          logger.error(`dapp not found for: ${request.url}`);
          callback({
            data: 'Not found',
            mimeType: 'text/plain',
            statusCode: 404,
          });
          return;
        }

        const { ipfsCid } = checkoutDappURL(dapp.origin);
        const { fsRelativePath } = splitPathname(pathnameWithQuery, ipfsCid);

        const ipfsService = await getIpfsService();

        let filePath = ipfsService.resolveFile(fsRelativePath);

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
        const reqURLInfo = extractIpfsInfo(request.url);

        const { fsRelativePath } = reqURLInfo;

        const ipfsService = await getIpfsService();
        let filePath = ipfsService.resolveFile(fsRelativePath);

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
