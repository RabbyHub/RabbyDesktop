import classNames from 'classnames';
import { isInternalProtocol } from 'isomorphic/url';
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

export default function DappAddressBar ({
  url
} : {
  url?: string
}) {
  const { addressUrl, isInternalUrl, onAddressUrlChange, onAddressUrlKeyUp } = useAddressUrl(
    url
  );

  return (
    <div className={classNames(styles['address-bar'], isInternalUrl && styles.forInternalUrl)}>
      {!isInternalUrl && (
        <div className={styles.securityInfo}>
          <img src="rabby-internal://assets/icons/native-tabs/icon-shield-default.svg" />
          <div className={styles.summaryText}>No risk fonud</div>
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
