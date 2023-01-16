import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';

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
