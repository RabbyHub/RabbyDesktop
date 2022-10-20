import { BrowserView, BrowserWindow } from "electron";
import { firstValueFrom } from "rxjs";
import LruCache from 'lru-cache';

import { IS_RUNTIME_PRODUCTION, RABBY_POPUP_GHOST_VIEW_URL } from "../../isomorphic/constants";

import { canoicalizeDappUrl, isUrlFromDapp } from "../../isomorphic/url";

import { dappStore, formatDapp } from "../store/dapps";
import { checkDappHttpsCert, queryDappLatestUpdateInfo } from "../utils/dapps";
import { randString } from "../../isomorphic/string";
import { AxiosError } from "axios";
import { fromMainSubject, valueToMainSubject } from "./_init";
import { getMainWindow } from "./tabbedBrowserWindow";
import { onIpcMainEvent } from "../utils/ipcMainEvents";

const securityCheckResults = new LruCache<IDapp['origin'], ISecurityCheckResult>({
  max: 500,
  // maxSize: 5000,
  ttl: 1000 * 90,
})

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

onIpcMainEvent('__internal_rpc:security-check:set-view-top', async () => {
  const win = (await getMainWindow()).window;
  const securityCheckPopupView = await firstValueFrom(fromMainSubject('securityCheckPopupViewReady'));
  win.removeBrowserView(securityCheckPopupView);
  win.addBrowserView(securityCheckPopupView);
});

onIpcMainEvent('__internal_rpc:security-check:get-dapp', (evt, reqid, dappUrl) => {
  const dapp = dappStore.get('dapps').find((item) => item.origin === canoicalizeDappUrl(dappUrl).origin);
  evt.reply('__internal_rpc:security-check:get-dapp', {
    reqid,
    dappInfo: dapp ? formatDapp(dapp) : null
  });
});

function getMockedChanged (dapp_id: string) {
  return {
    "dapp_id": dapp_id,
    "version": "482edf6719d385a4362f28f86d19025a",
    "is_changed": true,
    "new_detected_address_list": [ ],
    "create_at": Date.now() - 30 * 1e3
  }
}

export async function doCheckDappOrigin (origin: string) {
  // TODO: catch error here
  const [
    httpsCheckResult,
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
        latestChangedItemIn24Hr,
        // latestChangedItemIn24Hr: getMockedChanged(latestItem?.dapp_id)
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

  const httpsResult = httpsCheckResult?.type === 'HTTPS_CERT_INVALID' ? {
    httpsError: true,
    chromeErrorCode: httpsCheckResult.errorCode
  } : {
    httpsError: false,
    timeout: httpsCheckResult?.type === 'TIMEOUT'
  }

  // normalize result
  let countWarnings = 0, countDangerIssues = 0;
  let resultLevel = undefined as any as 'ok' | 'warning' | 'danger';

  if (latestUpdateResult.latestChangedItemIn24Hr?.create_at && latestUpdateResult.latestChangedItemIn24Hr?.is_changed) {
    countWarnings++;
    resultLevel = resultLevel || 'warning';
  }

  if (httpsResult.httpsError) {
    countDangerIssues++;
    resultLevel = 'danger';
  }

  resultLevel = resultLevel || 'ok';

  const checkResult: ISecurityCheckResult = {
    origin,
    countWarnings,
    countDangerIssues,
    countIssues: countWarnings + countDangerIssues,
    resultLevel,
    timeout: !!(httpsResult.timeout || latestUpdateResult.timeout),
    checkHttps: httpsResult,
    checkLatestUpdate: latestUpdateResult,
  };

  return checkResult;
}

onIpcMainEvent('__internal_rpc:security-check:request-check-dapp', async (evt, reqid, dappUrl) => {
  if (!isUrlFromDapp(dappUrl)) {
    evt.reply('__internal_rpc:security-check:request-check-dapp', {
      reqid,
      result: null,
      error: new Error(`Invalid dapp url: ${dappUrl}`)
    })
  }

  const origin = canoicalizeDappUrl(dappUrl).origin;

  let checkResult = securityCheckResults.get(origin);

  if (!checkResult)
    checkResult = await doCheckDappOrigin(origin);

  securityCheckResults.set(origin, checkResult);

  evt.reply('__internal_rpc:security-check:request-check-dapp', {
    reqid,
    result: checkResult,
    error: null
  })
});
