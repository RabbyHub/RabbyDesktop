import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from 'dayjs';

import { securityCheckGetDappInfo, queryAndPutDappSecurityCheckResult, continueOpenDapp } from "../ipcRequest/security-check";

const DEFAULT_HTTPS_RESULT: ISecurityCheckResult['checkHttps'] & { checking: boolean } = {
  level: 'ok',
  checking: false,
  timeout: false,
  httpsError: false,
};

const DEFAULT_DAPP_UPDATE_INFO_RESULT: ISecurityCheckResult['checkLatestUpdate'] & { checking: boolean } = {
  level: 'ok',
  checking: false,
  timeout: false,
  latestChangedItemIn24Hr: null as null | IDappUpdateDetectionItem,
};

function getViewOpData (checkResult: Pick<ISecurityCheckResult, 'countIssues' | 'countDangerIssues'>) {
  const couldOpenByDefault = !checkResult.countIssues || !checkResult.countDangerIssues;
  const reconfirmRequired = checkResult.countIssues && !checkResult.countDangerIssues;

  return {
    couldOpenByDefault,
    reconfirmRequired,
  }
}

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

  const resetState = useCallback(() => {
    setCheckingInfo({ url: '', continualOpenId: '' });
    setCheckResult({
      https: {...DEFAULT_HTTPS_RESULT},
      latestUpdate: {...DEFAULT_DAPP_UPDATE_INFO_RESULT},
      countIssues: 0 as ISecurityCheckResult['countIssues'],
      countDangerIssues: 0 as ISecurityCheckResult['countDangerIssues'],
      resultLevel: 'ok' as ISecurityCheckResult['resultLevel'],
    });
  }, []);

  useEffect(() => {
    const listener = (evt: EventListenerObject & { detail: { url: string, continualOpenId: string } }) => {
      resetState();
      setCheckingInfo({ url: evt.detail.url, continualOpenId: evt.detail.continualOpenId });
    };
    document.addEventListener('__set_checking_info__', listener as any);

    return () => {
      document.removeEventListener('__set_checking_info__', listener as any);
    }
  }, [ resetState ]);

  const hideView = useCallback(() => {
    window.rabbyDesktop.ipcRenderer.sendMessage('__internal_rpc:security-check:close-view')
    resetState();
  }, [ resetState, checkingInfo.url ]);

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
    queryAndPutDappSecurityCheckResult(checkingInfo.url)
      .then(newVal => {
        setCheckResult(prev => {
          return {
            ...prev,
            ...newVal,
            https: {...newVal.checkHttps, checking: false},
            latestUpdate: {...newVal.checkLatestUpdate, checking: false},
          }
        });

        const { couldOpenByDefault } = getViewOpData(newVal);
        setTimeout(() => {
          if (couldOpenByDefault) {
            continueOpenDapp(checkingInfo.continualOpenId, checkingInfo.url, newVal.resultLevel);
          }
        }, 500);
      })
      .catch(() => {
        setCheckResult((prev) => ({
          ...prev,
          https: {...prev.https, checking: false},
          latestUpdate: {...prev.latestUpdate, checking: false},
        }));
      })
  }, [ checkingInfo.url, hideView ]);

  const isChecking = checkResult.https.checking || checkResult.latestUpdate.checking;

  const closeNewTabAndThisView = useCallback(() => {
    window.rabbyDesktop.ipcRenderer.sendMessage('__internal_rpc:security-check:continue-close-dapp', checkingInfo.continualOpenId)
    window.rabbyDesktop.ipcRenderer.sendMessage('__internal_rpc:security-check:close-view');
  }, [ checkingInfo.continualOpenId ]);

  const checkItemViewLatestUpdateInfo = useMemo(() => {
    const changedIn24Hr = checkResult.latestUpdate.latestChangedItemIn24Hr?.create_at && checkResult.latestUpdate.latestChangedItemIn24Hr?.is_changed;
    return {
      warning: changedIn24Hr,
      resultText: !changedIn24Hr ? 'Updated more than 24 hours' : `The web page was updated within 24 hours at ${dayjs((checkResult.latestUpdate.latestChangedItemIn24Hr?.create_at || 0) * 1e3).format('YYYY/MM/DD HH:MM')}. To help you avoid potential code tampering and system bugs, we recommend using it 24 hours after the updates.`,
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

  const viewOperationData = getViewOpData(checkResult);

  return {
    dappInfo,

    isChecking,
    checkingUrl: checkingInfo.url,
    checkResult,

    checkItemViewHttps,
    checkItemViewLatestUpdateInfo,

    closeNewTabAndThisView,
    viewOperationData,

    hideView,
  }
}
