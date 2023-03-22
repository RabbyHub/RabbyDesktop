import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { removeElectronInUserAgent } from '@/isomorphic/string';

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

export function fixResponseHeaders(sess: Electron.Session) {
  const fixedUserAgent = removeElectronInUserAgent(sess.getUserAgent());
  sess.webRequest.onBeforeSendHeaders((details, callback) => {
    const uaK = Object.keys(details.requestHeaders).find(
      (k) => k.toLocaleLowerCase() === 'user-agent'
    );
    if (uaK && details.requestHeaders[uaK]?.includes('Electron')) {
      details.requestHeaders[uaK] = fixedUserAgent;
    }
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  // trim `Permissions-Policy: interest-cohort=()` for all responses
  // sess.webRequest.onHeadersReceived((details, callback) => {
  //   let responseHeaders = details.responseHeaders as Record<
  //     string,
  //     string | string[]
  //   >;
  //   if (
  //     Array.isArray(responseHeaders['permissions-policy']) &&
  //     typeof responseHeaders['permissions-policy'][0] === 'string' &&
  //     responseHeaders['permissions-policy'][0].includes('interest-cohort')
  //   ) {
  //     responseHeaders = { ...responseHeaders };
  //     const str = responseHeaders['permissions-policy'][0];
  //     responseHeaders['permissions-policy'] = str
  //       .split(',')
  //       .filter((item) => !item.includes('interest-cohort'))
  //       .join(',');
  //     callback({
  //       responseHeaders,
  //     });
  //     return;
  //   }

  //   callback({});
  // });
}
