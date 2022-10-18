import { useEffect, useMemo, useState } from "react";
import dayjs from 'dayjs';

import { securityCheckGetDappInfo, securityCheckDappBeforeOpen } from "../ipcRequest/security-check";

const DEFAULT_HTTPS_RESULT: ISecurityCheckResult['checkHttps'] & { checking: boolean } = {
  checking: false,
  timeout: false,
  httpsError: false,
};

const DEFAULT_DAPP_UPDATE_INFO_RESULT: ISecurityCheckResult['checkLatestUpdate'] & { checking: boolean } = {
  checking: false,
  timeout: false,
  dappUpdateInfo: null as null | IDappUpdateDetectionItem,
};

export function useCheckDapp() {
  const [ checkingInfo, setCheckingInfo ] = useState({
    url: '',
    continualOpenId: '',
  });
  const [ dappInfo, setDappInfo ] = useState(null as null | IDapp);

  const [ checkResult, setCheckResult ] = useState({
    https: {...DEFAULT_HTTPS_RESULT},
    latestUpdate: {...DEFAULT_DAPP_UPDATE_INFO_RESULT},
    countIssues: 0 as ISecurityCheckResult['countIssues'],
    countDangerIssues: 0 as ISecurityCheckResult['countDangerIssues'],
    resultLevel: 'ok' as ISecurityCheckResult['resultLevel'],
  });

  useEffect(() => {
    const listener = (evt: EventListenerObject & { detail: { url: string, continualOpenId: string } }) => {
      setCheckingInfo({ url: evt.detail.url, continualOpenId: evt.detail.continualOpenId });
    };
    document.addEventListener('__set_checking_info__', listener as any);

    return () => {
      document.removeEventListener('__set_checking_info__', listener as any);
    }
  }, []);

  useEffect(() => {
    if (!checkingInfo.url) return ;

    securityCheckGetDappInfo(checkingInfo.url)
      .then((dappInfo) => {
        setDappInfo(dappInfo);
      });

    setCheckResult((prev) => ({
      ...prev,
      https: {...DEFAULT_HTTPS_RESULT, checking: true},
      latestUpdate: {...DEFAULT_DAPP_UPDATE_INFO_RESULT, checking: true},
    }));
    securityCheckDappBeforeOpen(checkingInfo.url)
      .then(newVal => {
        // console.log('[feat] securityCheckDappBeforeOpen:: newVal', newVal);
        setCheckResult(prev => {
          return {
            ...prev,
            ...newVal,
            https: {...newVal.checkHttps, checking: false},
            latestUpdate: {...newVal.checkLatestUpdate, checking: false},
          }
        });

        // // open by default
        if (!newVal.countIssues) {
          window.rabbyDesktop.ipcRenderer.sendMessage('__internal_rpc:security-check:close-view');
          window.rabbyDesktop.ipcRenderer.sendMessage('__internal_rpc:security-check:continue-open-dapp', checkingInfo.continualOpenId, checkingInfo.url);
        }
      })
      .catch(() => {
        setCheckResult((prev) => ({
          ...prev,
          https: {...prev.https, checking: false},
          latestUpdate: {...prev.latestUpdate, checking: false},
        }));
      })
  }, [ checkingInfo.url ]);

  const isChecking = checkResult.https.checking || checkResult.latestUpdate.checking;

  const couldOpenManually = useMemo(() => {
    return checkResult.countIssues && !checkResult.countDangerIssues
  }, [checkResult])

  const checkItemViewLatestUpdateInfo = useMemo(() => {
    const changedIn24Hr = checkResult.latestUpdate.dappUpdateInfo?.create_at && checkResult.latestUpdate.dappUpdateInfo?.is_changed;
    return {
      warning: changedIn24Hr,
      resultText: !changedIn24Hr ? 'Updated more than 24 hours' : `The web page was updated within 24 hours at ${dayjs((checkResult.latestUpdate.dappUpdateInfo?.create_at || 0) * 1e3).format('YYYY/MM/DD HH:MM')}. To help you avoid potential code tampering and system bugs, we recommend using it 24 hours after the updates.`,
    };
  }, [
    checkResult.latestUpdate,
  ]);

  const checkItemViewHttps = useMemo(() => {
    return {
      danger: checkResult.https.httpsError,
      resultText: !checkResult.https.httpsError ? 'Valid and Verified' : `The website HTTPS certificate has expired or failed to verify. The link is no longer private. Your information (such as private key) is at risk of being attacked.`,
    };
  }, [
    checkResult.https,
  ]);

  return {
    dappInfo,

    isChecking,
    checkingUrl: checkingInfo.url,
    checkResult,

    checkItemViewHttps,
    checkItemViewLatestUpdateInfo,

    couldOpenManually,
  }
}
