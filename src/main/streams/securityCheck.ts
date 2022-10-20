import { BrowserView, BrowserWindow } from "electron";

import { firstValueFrom } from "rxjs";
import { RABBY_POPUP_GHOST_VIEW_URL } from "../../isomorphic/constants";

import { canoicalizeDappUrl } from "../../isomorphic/url";

import { dappStore, formatDapp } from "../store/dapps";
import { checkDappHttpsCert, queryDappLatestUpdateInfo } from "../utils/dapps";
import { randString } from "../../isomorphic/string";
import { AxiosError } from "axios";
import { fromMainSubject, valueToMainSubject } from "./_init";
import { getMainWindow } from "./tabbedBrowserWindow";
import { onIpcMainEvent } from "../utils/ipcMainEvents";

firstValueFrom(fromMainSubject('mainWindowReady')).then(async (mainWin) => {
  const targetWin = mainWin.window;
  const [width, height] = targetWin.getSize();

  const securityCheckPopupView = new BrowserView({
    webPreferences: {
      // session: await getTemporarySession(),
      webviewTag: true,
      sandbox: true,
      nodeIntegration: false,
      allowRunningInsecureContent: false,
      autoplayPolicy: 'user-gesture-required'
    }
  });

  securityCheckPopupView.setBounds({
    x: 0,
    y: 0,
    width,
    height,
  });
  securityCheckPopupView.setAutoResize({ width: true, height: true });

  // add to main window then remove
  targetWin.addBrowserView(securityCheckPopupView);
  securityCheckPopupView.webContents.loadURL(`${RABBY_POPUP_GHOST_VIEW_URL}#/security-check`);
  targetWin.removeBrowserView(securityCheckPopupView);

  // if (!IS_RUNTIME_PRODUCTION) {
  //   securityCheckPopupView.webContents.openDevTools({ mode: 'detach' });
  // }

  valueToMainSubject('securityCheckPopupViewReady', securityCheckPopupView);
})

export async function attachDappSecurityCheckView (
  url: string,
  targetWin?: BrowserWindow
) {
  targetWin = targetWin || (await getMainWindow()).window;
  const continualOpenId = randString();

  const securityCheckPopupView = await firstValueFrom(fromMainSubject('securityCheckPopupViewReady'));

  // dispatch custom event with url, continualOpenId
  securityCheckPopupView.webContents.executeJavaScript(`
document.dispatchEvent(new CustomEvent('__set_checking_info__', ${JSON.stringify({
  detail: {
    url, continualOpenId
  }
})}));
`);

  onIpcMainEvent('__internal_rpc:security-check:close-view', () => {
    targetWin?.removeBrowserView(securityCheckPopupView);
  });

  targetWin.addBrowserView(securityCheckPopupView);

  return { continualOpenId }
}

onIpcMainEvent('__internal_rpc:security-check:get-dapp', (evt, reqid, dappUrl) => {
  const dapp = dappStore.get('dapps').find((item) => item.origin === canoicalizeDappUrl(dappUrl).origin);
  evt.reply('__internal_rpc:security-check:get-dapp', {
    reqid,
    dappInfo: dapp ? formatDapp(dapp) : null
  });
});

onIpcMainEvent('__internal_rpc:security-check:check-dapp', async (evt, reqid, dappUrl) => {
  const origin = canoicalizeDappUrl(dappUrl).origin;
  // TODO: catch error here
  const [
    checkResult,
    latestUpdateResult
  ] = await Promise.all([
    checkDappHttpsCert(origin),
    queryDappLatestUpdateInfo({
      dapp_origin: origin,
    })
    .then((json) => {
      const latestItem = json.detect_list?.[0] || null;
      const latestChangedItemIn24Hr = json.detect_list?.find((item) =>
        item.is_changed && (Date.now() - item.create_at * 1e3) < 24 * 60 * 60 * 1e3
      ) || null;

      return {
        timeout: false,
        latestItem: latestItem || null,
        latestChangedItemIn24Hr
      }
    })
    .catch(err => {
      if ((err as AxiosError).code === 'timeout') {
        return {
          timeout: true,
          latestItem: null,
          latestChangedItemIn24Hr: null,
          error: err.message
        }
      } else {
        return {
          timeout: false,
          latestItem: null,
          latestChangedItemIn24Hr: null,
          error: 'unknown'
        }
      }
    })
  ]);

  const httpsResult = checkResult?.type === 'HTTPS_CERT_INVALID' ? {
    httpsError: true,
    chromeErrorCode: checkResult.errorCode
  } : {
    httpsError: false,
    timeout: checkResult?.type === 'TIMEOUT'
  }

  // normalize result
  let countIssues = 0, countDangerIssues = 0;
  let resultLevel = undefined as any as 'ok' | 'warning' | 'danger';

  if (latestUpdateResult.latestChangedItemIn24Hr?.create_at && latestUpdateResult.latestChangedItemIn24Hr?.is_changed) {
    countIssues++;
    resultLevel = resultLevel || 'warning';
  }

  if (httpsResult.httpsError) {
    countIssues++;
    countDangerIssues++;
    resultLevel = 'danger';
  }

  resultLevel = resultLevel || 'ok';

  evt.reply('__internal_rpc:security-check:check-dapp', {
    reqid,
    countIssues,
    countDangerIssues,
    resultLevel,
    timeout: !!(httpsResult.timeout || latestUpdateResult.timeout),
    checkHttps: httpsResult,
    checkLatestUpdate: latestUpdateResult,
  })
});
