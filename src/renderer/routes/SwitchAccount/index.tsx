import {
  useAccounts,
  useCurrentAccount,
} from '@/renderer/hooks/rabbyx/useAccount';
import { useContextMenuPageInfo } from '@/renderer/hooks/useContextMenuPage';
import { useBodyClassNameOnMounted } from '@/renderer/hooks/useMountedEffect';
import { hideContextMenuPopup } from '@/renderer/ipcRequest/contextmenu-popup';
import classNames from 'classnames';
import { useEffect } from 'react';
import styles from './index.module.less';

export default function SwitchAccountPopup() {
  useBodyClassNameOnMounted('switch-account-popup');
  const pageInfo = useContextMenuPageInfo('switch-account');

  const { currentAccount, switchAccount } = useCurrentAccount();
  const { accounts, fetchAccounts } = useAccounts();

  useEffect(() => {
    if (pageInfo?.type === 'switch-account') {
      fetchAccounts();
    }
  }, [pageInfo?.type, fetchAccounts]);

  if (!accounts.length) return null;

  return (
    <div className={styles.SwitchAccountPopup}>
      {accounts.map((account) => {
        return (
          <div
            key={`account-${account.address}`}
            className={classNames(
              styles.accountItem,
              currentAccount?.address === account.address && styles.active
            )}
            onClick={() => {
              switchAccount(account);
              hideContextMenuPopup('switch-account');
            }}
          >
            <div className={styles.accountTypeIcon}>
              <img
                src="rabby-internal://assets/icons/import/key.svg"
                alt="key"
              />
            </div>
            <div className={styles.accountInfo}>
              <div className={styles.accountName}>
                {account.alianName || '-'}
              </div>
              <div className={styles.accountAddress}>{account.address}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
