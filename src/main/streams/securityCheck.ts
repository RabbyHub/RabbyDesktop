import { BrowserWindow } from "electron";
import { firstValueFrom } from "rxjs";
import LruCache from 'lru-cache';

import { IS_RUNTIME_PRODUCTION, RABBY_POPUP_GHOST_VIEW_URL } from "../../isomorphic/constants";

import { canoicalizeDappUrl, isUrlFromDapp } from "../../isomorphic/url";

import { dappStore, formatDapp } from "../store/dapps";
import { checkDappHttpsCert, queryDappLatestUpdateInfo } from "../utils/dapps";
import { randString } from "../../isomorphic/string";
import { AxiosError } from "axios";
import { fromMainSubject, valueToMainSubject } from "./_init";
import { getMainWindow, onMainWindowReady } from "./tabbedBrowserWindow";
import { onIpcMainEvent } from "../utils/ipcMainEvents";
import { NATIVE_HEADER_WITH_NAV_H } from "../../isomorphic/const-size";
import { createPopupWindow, hidePopupWindow, showPopupWindow } from "../utils/browser";

const securityCheckResults = new LruCache<IDapp['origin'], ISecurityCheckResult>({
  max: 500,
  // maxSize: 5000,
  ttl: 1000 * 90,
})

onMainWindowReady().then(async (mainWin) => {
  const targetWin = mainWin.window;

  const popupWin = createPopupWindow({ parent: targetWin });

  updateSubWindowPosition(targetWin, popupWin);
  const onTargetWinUpdate = () => {
    updateSubWindowPosition(targetWin, popupWin);
  };

  targetWin.on('show', onTargetWinUpdate);
  targetWin.on('move', onTargetWinUpdate);
  targetWin.on('resize', onTargetWinUpdate);
  targetWin.on('unmaximize', onTargetWinUpdate);
  targetWin.on('restore', onTargetWinUpdate);

  await popupWin.webContents.loadURL(`${RABBY_POPUP_GHOST_VIEW_URL}#/security-check`);

  // debug-only
  if (!IS_RUNTIME_PRODUCTION) {
    // popupWin.webContents.openDevTools({ mode: 'detach' });
  }

  hidePopupWindow(popupWin);

  valueToMainSubject('securityCheckPopupWindowReady', popupWin);

  targetWin.on('close', () => {
    popupWin?.close();
  });
})

function updateSubWindowPosition(
  parentWin: BrowserWindow,
  window: BrowserWindow,
) {
  const [width, height] = parentWin.getSize();

  const popupRect = {
    x: 0,
    y: NATIVE_HEADER_WITH_NAV_H,
    width: width,
    height: height - NATIVE_HEADER_WITH_NAV_H,
  }

  window.setSize(popupRect.width, popupRect.height);

  // get bounds
  const pWinBounds = parentWin.getBounds()
  const selfViewBounds = window.getBounds()

  // top-right
  let x = pWinBounds.x + popupRect.x + popupRect.width - selfViewBounds.width
  let y = pWinBounds.y + popupRect.y + /* padding */1

  // Convert to ints
  x = Math.floor(x)
  y = Math.floor(y)

  window.setBounds({ ...popupRect, x, y }, true)
}

export async function openDappSecurityCheckView (
  url: string,
  targetWin?: BrowserWindow
) {
  targetWin = targetWin || (await getMainWindow()).window;
  const continualOpenId = randString();

  const popupWin = await firstValueFrom(fromMainSubject('securityCheckPopupWindowReady'));
  updateSubWindowPosition(targetWin, popupWin);

  // dispatch custom event with url, continualOpenId
  popupWin.webContents.executeJavaScript(`
document.dispatchEvent(new CustomEvent('__set_checking_info__', ${JSON.stringify({
  detail: {
    url, continualOpenId
  }
})}));
`);

  showPopupWindow(popupWin);
  popupWin.moveTop();

  return { continualOpenId }
}

onIpcMainEvent('__internal_rpc:security-check:close-view', async () => {
  const popupWin = await firstValueFrom(fromMainSubject('securityCheckPopupWindowReady'));
  hidePopupWindow(popupWin);
  // const targetWin = (await getMainWindow()).window;
  // targetWin.moveTop();
});

onIpcMainEvent('__internal_rpc:security-check:set-view-top', async () => {
  const popupWin = await firstValueFrom(fromMainSubject('securityCheckPopupWindowReady'));
  popupWin.moveTop();
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
