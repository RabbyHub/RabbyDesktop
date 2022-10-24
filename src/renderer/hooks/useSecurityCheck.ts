import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from 'dayjs';

import { securityCheckGetDappInfo, queryAndPutDappSecurityCheckResult, continueOpenDapp } from "../ipcRequest/security-check";

const DEFAULT_HTTPS_RESULT: ISecurityCheckResult['checkHttps'] = {
  level: 'ok',
  timeout: false,
  httpsError: false,
};

const DEFAULT_DAPP_UPDATE_INFO_RESULT: ISecurityCheckResult['checkLatestUpdate'] = {
  level: 'ok',
  timeout: false,
  latestChangedItemIn24Hr: null as null | IDappUpdateDetectionItem,
};

const DEFAULT_CHECKING_INFO = {
  url: '',
  continualOpenId: '',
  checkingHttps: false,
  checkingLastUpdate: false,
};

function makeDefaultCheckResult () {
  return {
    https: {...DEFAULT_HTTPS_RESULT},
    latestUpdate: {...DEFAULT_DAPP_UPDATE_INFO_RESULT},
    countIssues: 0 as ISecurityCheckResult['countIssues'],
    countDangerIssues: 0 as ISecurityCheckResult['countDangerIssues'],
    resultLevel: 'ok' as ISecurityCheckResult['resultLevel'],
  };
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
  const [ checkingInfo, setCheckingInfo ] = useState<typeof DEFAULT_CHECKING_INFO>({ ...DEFAULT_CHECKING_INFO });
  const [ dappInfo, setDappInfo ] = useState(null as null | IDapp);

  const [ checkResult, setCheckResult ] = useState(makeDefaultCheckResult());

  const resetState = useCallback((nextCheckingInfo?: Partial<typeof DEFAULT_CHECKING_INFO>) => {
    setCheckingInfo({ ...DEFAULT_CHECKING_INFO, ...nextCheckingInfo });
    setCheckResult(makeDefaultCheckResult());
  }, []);

  const hideView = useCallback(() => {
    window.rabbyDesktop.ipcRenderer.sendMessage('__internal_rpc:security-check:close-view')
    resetState();
  }, [ resetState ]);

  const doFetch = useCallback(async (url: string, continualOpenId: string) => {
    if (!url) return ;

    securityCheckGetDappInfo(url)
      .then((dappInfo) => {
        setDappInfo(dappInfo);
      });

    setCheckingInfo((prev) => ({
      ...prev,
      checkingHttps: true,
      checkingLastUpdate: true,
    }));
    queryAndPutDappSecurityCheckResult(url)
      .then(newVal => {
        setCheckResult(prev => {
          return {
            ...prev,
            ...newVal,
            https: {...newVal.checkHttps},
            latestUpdate: {...newVal.checkLatestUpdate},
          }
        });

        const { couldOpenByDefault } = getViewOpData(newVal);
        setTimeout(() => {
          if (couldOpenByDefault) {
            continueOpenDapp(continualOpenId, url, newVal.resultLevel);
          }
        }, 500);
      })
      .finally(() => {
        setCheckingInfo((prev) => ({
          ...prev,
          checkingHttps: false,
          checkingLastUpdate: false,
        }));
      })
  }, []);

  useEffect(() => {
    const dispose = window.rabbyDesktop.ipcRenderer.on('__internal_rpc:security-check:start-check-dapp', ({ url, continualOpenId }) => {
      resetState({ url: url, continualOpenId: continualOpenId });
      doFetch(url, continualOpenId);
    })

    return dispose;

  }, [ resetState ]);

  const isChecking = checkingInfo.checkingHttps || checkingInfo.checkingLastUpdate;

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

    checkingInfo,
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
