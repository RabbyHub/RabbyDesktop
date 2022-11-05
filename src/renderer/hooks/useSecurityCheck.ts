import { useCallback, useEffect, useMemo, useState } from 'react';

import { formatSeconds } from '@/isomorphic/date';
import {
  securityCheckGetDappInfo,
  queryAndPutDappSecurityCheckResult,
} from '../ipcRequest/security-check';
import { openDappAddressbarSecurityPopupView } from '../ipcRequest/security-addressbarpopup';

const DEFAULT_HTTPS_RESULT: ISecurityCheckResult['checkHttps'] = {
  level: 'ok',
  timeout: false,
  httpsError: false,
};

const DEFAULT_DAPP_UPDATE_INFO_RESULT: ISecurityCheckResult['checkLatestUpdate'] =
  {
    level: 'ok',
    timeout: false,
    latestChangedItemIn24Hr: null as null | IDappUpdateDetectionItem,
  };

const DEFAULT_CHECKING_INFO = {
  url: '',
  continualOpId: '',
  checkingHttps: false,
  checkingLastUpdate: false,
};

function makeDefaultCheckResult() {
  return {
    checkHttps: { ...DEFAULT_HTTPS_RESULT },
    checkLatestUpdate: { ...DEFAULT_DAPP_UPDATE_INFO_RESULT },
    countIssues: 0 as ISecurityCheckResult['countIssues'],
    countDangerIssues: 0 as ISecurityCheckResult['countDangerIssues'],
    resultLevel: 'ok' as ISecurityCheckResult['resultLevel'],
  };
}

export function useSecurityCheckForDapp() {
  const [checkingInfo, setCheckingInfo] = useState<
    typeof DEFAULT_CHECKING_INFO
  >({ ...DEFAULT_CHECKING_INFO });
  const [dappInfo, setDappInfo] = useState(null as null | IDapp);

  const [checkResult, setCheckResult] = useState(makeDefaultCheckResult());

  const resetState = useCallback(
    (nextCheckingInfo?: Partial<typeof DEFAULT_CHECKING_INFO>) => {
      setCheckingInfo({ ...DEFAULT_CHECKING_INFO, ...nextCheckingInfo });
      setCheckResult(makeDefaultCheckResult());
    },
    []
  );

  const hideViewAndPopupSecurityInfo = useCallback(
    (dappUrl: string) => {
      window.rabbyDesktop.ipcRenderer.sendMessage(
        '__internal_rpc:security-check:close-view'
      );
      openDappAddressbarSecurityPopupView(dappUrl);

      resetState();
    },
    [resetState]
  );

  const resetView = useCallback(() => {
    window.rabbyDesktop.ipcRenderer.sendMessage(
      '__internal_rpc:security-check:close-view'
    );

    resetState();
  }, [resetState]);

  const doFetch = useCallback(
    async (url: string) => {
      if (!url) return;

      securityCheckGetDappInfo(url).then((newVal) => {
        setDappInfo(newVal);
      });

      setCheckingInfo((prev) => ({
        ...prev,
        checkingHttps: true,
        checkingLastUpdate: true,
      }));
      queryAndPutDappSecurityCheckResult(url)
        .then((newVal) => {
          setCheckResult((prev) => {
            return {
              ...prev,
              ...newVal,
            };
          });

          setTimeout(() => {
            if (newVal.resultLevel === 'ok') {
              hideViewAndPopupSecurityInfo(url);
            }
          }, 500);
        })
        .finally(() => {
          setCheckingInfo((prev) => ({
            ...prev,
            checkingHttps: false,
            checkingLastUpdate: false,
          }));
        });
    },
    [hideViewAndPopupSecurityInfo]
  );

  useEffect(() => {
    const dispose = window.rabbyDesktop.ipcRenderer.on(
      '__internal_rpc:security-check:start-check-dapp',
      ({ url, continualOpId }) => {
        resetState({ url, continualOpId });
        doFetch(url);
      }
    );

    return dispose;
  }, [doFetch, resetState]);

  const isChecking =
    checkingInfo.checkingHttps || checkingInfo.checkingLastUpdate;

  const closeNewTabAndPopupSecurityInfo = useCallback(
    (dappUrl: string) => {
      window.rabbyDesktop.ipcRenderer.sendMessage(
        '__internal_rpc:security-check:continue-close-dapp',
        checkingInfo.continualOpId
      );
      window.rabbyDesktop.ipcRenderer.sendMessage(
        '__internal_rpc:security-check:close-view'
      );
      openDappAddressbarSecurityPopupView(dappUrl);
    },
    [checkingInfo.continualOpId]
  );

  const checkItemViewLatestUpdateInfo = useMemo(() => {
    if (
      checkResult.checkLatestUpdate.latestChangedItemIn24Hr?.create_at &&
      checkResult.checkLatestUpdate.latestChangedItemIn24Hr?.is_changed
    ) {
      return {
        resultText: `The web page was updated within 24 hours at ${formatSeconds(
          checkResult.checkLatestUpdate.latestChangedItemIn24Hr.create_at || 0,
          'YYYY/MM/DD HH:mm'
        )}. To help you avoid potential code tampering and system bugs, we recommend using it 24 hours after the updates.`,
      };
    }
    if (checkResult.checkLatestUpdate.timeout) {
      return {
        resultText: 'Check Timeout',
      };
    }

    return {
      resultText: 'Updated more than 24 hours',
    };
  }, [checkResult.checkLatestUpdate]);

  const checkItemViewHttps = useMemo(() => {
    if (checkResult.checkHttps.httpsError) {
      return {
        resultText: `The website HTTPS certificate has expired or failed to verify. The link is no longer private. Your information (such as private key) is at risk of being attacked.`,
      };
    }

    if (checkResult.checkHttps.timeout) {
      return {
        resultText: 'Check Timeout',
      };
    }

    return {
      resultText: 'Valid and Verified',
    };
  }, [checkResult.checkHttps]);

  return {
    dappInfo,

    checkingInfo,
    isChecking,
    checkingUrl: checkingInfo.url,
    checkResult,

    checkItemViewHttps,
    checkItemViewLatestUpdateInfo,

    closeNewTabAndPopupSecurityInfo,

    hideViewAndPopupSecurityInfo,
    resetView,
  };
}
