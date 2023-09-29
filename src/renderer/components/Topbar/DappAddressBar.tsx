import classNames from 'classnames';
import {
  isInternalProtocol,
  isMainWinShellWebUI,
  isUrlFromDapp,
} from 'isomorphic/url';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './DappAddressBar.module.less';

function useAddressUrl(updatedUrl?: string) {
  const [addressUrl, setAddressUrl] = useState(updatedUrl || '');
  const onAddressUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setAddressUrl(e.target.value);
    },
    []
  );

  useEffect(() => {
    setAddressUrl(updatedUrl || '');
  }, [updatedUrl]);

  const onAddressUrlKeyUp = useCallback(
    (
      event: GetListenerFirstParams<
        React.HTMLAttributes<HTMLInputElement>['onKeyUp']
      >
    ) => {
      if (event.key === 'Enter') {
        const url = (event.target as HTMLInputElement).value;
        chrome.tabs.update({ url });
      }
    },
    []
  );

  return {
    addressUrl,
    isInternalUrl: useMemo(() => isInternalProtocol(addressUrl), [addressUrl]),
    onAddressUrlChange,
    onAddressUrlKeyUp,
  };
}

const IS_MAIN_SHELL = isMainWinShellWebUI(window.location.href);

export default function DappAddressBar({
  url,
  checkResult,
}: {
  url?: string;
  checkResult?: ISecurityCheckResult | null;
}) {
  const { addressUrl, isInternalUrl, onAddressUrlChange, onAddressUrlKeyUp } =
    useAddressUrl(url);

  const openSecurityAddressbarpopup = useCallback(() => {
    // if (!IS_MAIN_SHELL) return;
    // if (!url) return;
    // openDappAddressbarSecurityPopupView(url);
  }, []);

  return (
    <div
      className={classNames(
        'address-bar',
        styles['address-bar'],
        isInternalUrl && styles.forInternalUrl
      )}
    >
      {checkResult && (
        <div
          className={classNames(
            styles.securityInfo,
            `J_security_level-${checkResult.resultLevel}`
          )}
          onClick={openSecurityAddressbarpopup}
        >
          {checkResult.resultLevel === 'ok' && (
            <>
              <img src="rabby-internal://assets/icons/native-tabs/icon-shield-default.svg" />
              <div className={styles.summaryText}>No risk fonud</div>
            </>
          )}
          {checkResult.resultLevel === 'warning' && (
            <>
              <img src="rabby-internal://assets/icons/native-tabs/icon-shield-warning.svg" />
              <div className={styles.summaryText}>
                Found {checkResult.countWarnings} Warning(s)
              </div>
            </>
          )}
          {checkResult.resultLevel === 'danger' && (
            <>
              <img src="rabby-internal://assets/icons/native-tabs/icon-shield-danger.svg" />
              <div className={styles.summaryText}>
                Found {checkResult.countDangerIssues} Danger Risk(s)
              </div>
            </>
          )}
        </div>
      )}
      {isInternalUrl ? (
        <div className="hidden-address" />
      ) : (
        <input
          id="addressurl"
          spellCheck={false}
          value={addressUrl}
          disabled
          // defaultValue={activeTab?.url || ''}
          onKeyUp={onAddressUrlKeyUp}
          onChange={onAddressUrlChange}
        />
      )}
    </div>
  );
}
