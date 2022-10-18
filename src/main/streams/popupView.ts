import { BrowserView, BrowserWindow } from "electron";
import { firstValueFrom } from "rxjs";

import { canoicalizeDappUrl } from "../../isomorphic/url";
import { IS_RUNTIME_PRODUCTION, RABBY_ALERT_INSECURITY_URL, RABBY_POPUP_GHOST_VIEW_URL } from "../../isomorphic/constants";
import { onIpcMainEvent } from "../utils/ipcMainEvents";
import { getMainWindow } from "./tabbedBrowserWindow";
import { dappStore, formatDapp } from "../store/dapps";
import { checkDappHttpsCert, queryDappLatestUpdateInfo } from "../utils/dapps";
import { randString } from "../../isomorphic/string";
import { AxiosError } from "axios";
import { fromMainSubject, valueToMainSubject } from "./_init";

firstValueFrom(fromMainSubject('mainWindowReady')).then(async (mainWin) => {
  const targetWin = mainWin.window;
  const [width, height] = targetWin.getSize();

  const mainWinGhostView = new BrowserView({
    webPreferences: {
      // session: await getTemporarySession(),
      webviewTag: true,
      sandbox: true,
      nodeIntegration: false,
      allowRunningInsecureContent: false,
      autoplayPolicy: 'user-gesture-required'
    }
  });

  mainWinGhostView.setBounds({
    x: 0,
    y: 0,
    width,
    height,
  });
  mainWinGhostView.setAutoResize({ width: true, height: true });

  // add to main window then remove
  targetWin.addBrowserView(mainWinGhostView);
  mainWinGhostView.webContents.loadURL(`${RABBY_POPUP_GHOST_VIEW_URL}#/security-check`);
  targetWin.removeBrowserView(mainWinGhostView);

  if (!IS_RUNTIME_PRODUCTION) {
    mainWinGhostView.webContents.openDevTools({ mode: 'detach' });
  }

  valueToMainSubject('mainPopupGhostViewReady', mainWinGhostView);
})

export async function attachDappSecurityCheckView (
  url: string,
  targetWin?: BrowserWindow
) {
  targetWin = targetWin || (await getMainWindow()).window;
  const continualOpenId = randString();

  const securityCheckPopup = await firstValueFrom(fromMainSubject('mainPopupGhostViewReady'));

  // dispatch custom event with url, continualOpenId
  securityCheckPopup.webContents.executeJavaScript(`
document.dispatchEvent(new CustomEvent('__set_checking_info__', ${JSON.stringify({
  detail: {
    url, continualOpenId
  }
})}));
`);

  onIpcMainEvent('__internal_rpc:security-check:close-view', () => {
    targetWin?.removeBrowserView(securityCheckPopup);
  });

  targetWin.addBrowserView(securityCheckPopup);

  return { continualOpenId }
}

onIpcMainEvent('__internal_rpc:security-check:get-dapp', (evt, reqid, dappUrl) => {
  const dapp = dappStore.get('dapps').find((item) => item.origin === canoicalizeDappUrl(dappUrl).origin);
  evt.reply('__internal_rpc:security-check:get-dapp', {
    reqid,
    dappInfo: dapp ? formatDapp(dapp) : null
  });
});

onIpcMainEvent('__internal_rpc:security-check:batch', async (evt, reqid, dappUrl) => {
  const origin = canoicalizeDappUrl(dappUrl).origin;
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
      return {
        timeout: false,
        dappUpdateInfo: latestItem || null
      }
    })
    .catch(err => {
      if ((err as AxiosError).code === 'timeout') {
        return {
          timeout: true,
          dappUpdateInfo: null,
          error: err.message
        }
      } else {
        return {
          timeout: false,
          dappUpdateInfo: null,
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

  if (latestUpdateResult.dappUpdateInfo?.create_at && latestUpdateResult.dappUpdateInfo?.is_changed) {
    countIssues++;
    resultLevel = resultLevel || 'warning';
  }

  if (httpsResult.httpsError) {
    countIssues++;
    countDangerIssues++;
    resultLevel = 'danger';
  }

  resultLevel = resultLevel || 'ok';

  evt.reply('__internal_rpc:security-check:batch', {
    reqid,
    countIssues,
    countDangerIssues,
    resultLevel,
    timeout: !!(httpsResult.timeout || latestUpdateResult.timeout),
    checkHttps: httpsResult,
    checkLatestUpdate: latestUpdateResult,
  })
});

let alertView: BrowserView;
export async function attachAlertBrowserView (
  url: string, isExisted = false, targetWin?: BrowserWindow
) {
  if (!alertView) {
    // TODO: use standalone session open it
    alertView = new BrowserView({
      webPreferences: {
        // session: await getTemporarySession(),
        webviewTag: true,
        sandbox: true,
        nodeIntegration: false,
        allowRunningInsecureContent: false,
        autoplayPolicy: 'user-gesture-required'
      }
    });
    alertView.webContents.loadURL(`${RABBY_ALERT_INSECURITY_URL}?__init_url__=${encodeURIComponent(url)}`);
  }

  alertView.webContents.send('__internal_alert-security-url', { url, isExisted });

  targetWin = targetWin || (await getMainWindow()).window;

  const dispose = onIpcMainEvent('__internal_close-alert-insecure-content', () => {
    targetWin?.removeBrowserView(alertView);
    // destroyBrowserWebview(alertView);

    dispose?.();
  });

  targetWin.addBrowserView(alertView);

  const [width, height] = targetWin.getSize();

  alertView!.setBounds({
    x: 0,
    y: 0,
    width,
    height,
  });
  alertView!.setAutoResize({ width: true, height: true });
}
