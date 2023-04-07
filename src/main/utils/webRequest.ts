import { IS_RUNTIME_PRODUCTION, LOCALIPFS_BRAND } from '@/isomorphic/constants';
import { trimWebContentsUserAgent } from '@/isomorphic/string';

type ISendHeadersListener = Parameters<
  Electron.Session['webRequest']['onBeforeSendHeaders']
>[0] &
  object;
type HoF = (ctx: {
  details: Parameters<ISendHeadersListener>[0];
  retReqHeaders: typeof ctx.details.requestHeaders;
}) => void;

function supportHmrOnDev(): HoF {
  // TODO: apply it on dev mode for dev-server
  return (ctx) => {
    if (IS_RUNTIME_PRODUCTION) return;

    const retReqHeaders = ctx.retReqHeaders;

    if (
      ctx.details.url.startsWith('ws://') &&
      retReqHeaders.Origin === 'rabby-internal://local'
    ) {
      const urlInfo = new URL(ctx.details.url);
      // leave here for debug
      // console.debug('[debug] --onBeforeSendHeaders-- before', retReqHeaders)
      retReqHeaders.Origin = `http://${urlInfo.host}`;
      // leave here for debug
      // console.debug('[debug] --onBeforeSendHeaders-- before', reqHeaders)
    }
  };
}

function supportModifyReqHeaders(fixedUserAgent: string): HoF {
  return (ctx) => {
    if (ctx.details.url.includes('local.ipfs.')) {
      const kName = Object.keys(ctx.details.requestHeaders).find(
        (k) => k.toLocaleLowerCase() === 'upgrade-insecure-requests'
      );

      if (kName) {
        ctx.retReqHeaders[kName] = '0';
      }
    }

    const uaKs = Object.keys(ctx.retReqHeaders).filter(
      (k) => k.toLocaleLowerCase() === 'user-agent'
    );
    if (uaKs.length) {
      uaKs.forEach((uaK) => {
        if (uaKs.length && ctx.retReqHeaders[uaK]?.includes('Electron')) {
          ctx.retReqHeaders[uaK] = fixedUserAgent;
        }
      });
    } else {
      ctx.retReqHeaders['User-Agent'] = fixedUserAgent;
    }
  };
}

export function rewriteSessionWebRequestHeaders(
  sess: Electron.Session,
  sessionName?: keyof IAppSession
) {
  const fixedUserAgent = trimWebContentsUserAgent(sess.getUserAgent());
  sess.webRequest.onBeforeSendHeaders((details, callback) => {
    const pipeCtx = {
      details,
      retReqHeaders: { ...details.requestHeaders },
    };

    supportModifyReqHeaders(fixedUserAgent)(pipeCtx);
    if (sessionName === 'mainSession') {
      supportHmrOnDev()(pipeCtx);
    }
    if (
      details.url.includes(LOCALIPFS_BRAND) &&
      Object.keys(pipeCtx.retReqHeaders).find(
        (k) => k.toLocaleLowerCase() === 'upgrade-insecure-requests'
      )
    ) {
      console.debug(
        `[debug][${sessionName}] pipeCtx.retReqHeaders, details.url`,
        pipeCtx.retReqHeaders,
        details.url
      );
    }

    callback({ cancel: false, requestHeaders: pipeCtx.retReqHeaders });
  });

  // sess.webRequest.onBeforeRequest((details, callback) => {
  //   if (details.url.startsWith('https://local.ipfs.')) {
  //     callback({
  //       redirectURL: details.url.replace('https://local.ipfs.', 'http://local.ipfs.'),
  //       // redirectURL: details.url.replace(
  //       //   'https://local.ipfs.',
  //       //   'rabby-ipfs://'
  //       // ),
  //     });
  //     return;
  //   }

  //   callback({});
  // });

  // // trim `Permissions-Policy: interest-cohort=()` for all responses
  // sess.webRequest.onHeadersReceived((details, callback) => {
  //   let responseHeaders = details.responseHeaders as Record<
  //     string,
  //     string | string[]
  //   >;

  //   let policies = arraify(responseHeaders['permissions-policy']).filter(Boolean);
  //   if (
  //     Array.isArray(responseHeaders['permissions-policy']) &&
  //     typeof policies[0] === 'string' &&
  //     policies[0].includes('interest-cohort')
  //   ) {
  //     responseHeaders = { ...responseHeaders };
  //     const str = policies[0];
  //     const policyStr = str
  //       .split(',')
  //       .filter((item) => !item.includes('interest-cohort'))
  //       .join(',');

  //     if (policyStr) {
  //       responseHeaders['permissions-policy'] = policyStr;
  //     } else {
  //       delete responseHeaders['permissions-policy'];
  //     }
  //     callback({
  //       responseHeaders,
  //     });
  //     return;
  //   }

  //   callback({});
  // });
}

/**
 * @deprecated
 */
export function supportRewriteCORS(session: Electron.Session) {
  session.webRequest.onBeforeSendHeaders((_details, callback) => {
    let reqHeaders = _details.requestHeaders;
    if (reqHeaders.Origin?.startsWith('rabby-ipfs://')) {
      reqHeaders = { ..._details.requestHeaders };

      const urlInfo = new URL(_details.url);
      reqHeaders.Origin = `http://${urlInfo.host}`;
    }

    if (reqHeaders.Origin === 'rabby-ipfs://') {
      reqHeaders.Origin = '*';
    }

    callback({
      cancel: false,
      requestHeaders: reqHeaders,
    });
  });

  // it's insecure for http-type dapp.
  session.webRequest.onHeadersReceived((details, callback) => {
    const resHeaders = { ...details.responseHeaders };

    // it maybe cause repeative value in headers `Access-Control-Allow-Origin`
    if (!resHeaders['Access-Control-Allow-Origin']?.length) {
      resHeaders['Access-Control-Allow-Origin'] = ['*'];
    }
    callback({
      responseHeaders: resHeaders,
    });
  });
}
