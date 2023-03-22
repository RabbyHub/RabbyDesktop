import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { trimWebContentsUserAgent } from '@/isomorphic/string';
// import { arraify } from '@/isomorphic/array';

export function supportHmrOnDev(session: Electron.Session) {
  // TODO: apply it on dev mode for dev-server
  if (IS_RUNTIME_PRODUCTION) return;

  session.webRequest.onBeforeSendHeaders((_details, callback) => {
    let reqHeaders = _details.requestHeaders;
    if (
      _details.url.startsWith('ws://') &&
      reqHeaders.Origin === 'rabby-internal://local'
    ) {
      reqHeaders = { ..._details.requestHeaders };

      const urlInfo = new URL(_details.url);
      // leave here for debug
      // console.debug('[debug] --onBeforeSendHeaders-- before', reqHeaders)
      reqHeaders.Origin = `http://${urlInfo.host}`;
      // leave here for debug
      // console.debug('[debug] --onBeforeSendHeaders-- before', reqHeaders)
    }
    callback({
      cancel: false,
      requestHeaders: reqHeaders,
    });
  });
}

export function rewriteSessionWebRequestHeaders(sess: Electron.Session) {
  const fixedUserAgent = trimWebContentsUserAgent(sess.getUserAgent());
  sess.webRequest.onBeforeSendHeaders((details, callback) => {
    const requestHeaders = details.requestHeaders;
    const uaKs = Object.keys(requestHeaders).filter(
      (k) => k.toLocaleLowerCase() === 'user-agent'
    );
    if (uaKs.length) {
      uaKs.forEach((uaK) => {
        if (uaKs.length && requestHeaders[uaK]?.includes('Electron')) {
          requestHeaders[uaK] = fixedUserAgent;
        }
      });
    } else {
      requestHeaders['User-Agent'] = fixedUserAgent;
    }

    callback({ cancel: false, requestHeaders });
  });

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
