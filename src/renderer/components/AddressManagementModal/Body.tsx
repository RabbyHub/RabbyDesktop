import { IDisplayedAccountWithBalance } from '@/renderer/hooks/rabbyx/useAccountToDisplay';
import React from 'react';
import { AccountItem } from './AccountItem';
import styles from './index.module.less';

interface Props {
  accounts: IDisplayedAccountWithBalance[];
  contacts: IDisplayedAccountWithBalance[];
  onSelect: (account: IDisplayedAccountWithBalance) => void;
  onSwitchAccount: (account: IDisplayedAccountWithBalance) => void;
  onDelete: (account: IDisplayedAccountWithBalance) => void;
  isUpdatingBalance?: boolean;
}

export const Body: React.FC<Props> = ({
  accounts,
  contacts,
  onSelect,
  onSwitchAccount,
  onDelete,
  isUpdatingBalance,
}) => {
  const renderAccountItem = React.useCallback(
    (account: IDisplayedAccountWithBalance) => {
      return (
        <AccountItem
          onClickAction={(e) => {
            e.stopPropagation();
            onSelect(account);
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSwitchAccount(account);
          }}
          onClickDelete={(e) => {
            e.stopPropagation();
            onDelete(account);
          }}
          account={account}
          key={account.address + account.type + account.brandName}
          isUpdatingBalance={isUpdatingBalance}
        />
      );
    },
    [isUpdatingBalance, onDelete, onSelect, onSwitchAccount]
  );

  return (
    <section className={styles.body}>
      {!!accounts?.length && (
        <div className={styles.group}>{accounts.map(renderAccountItem)}</div>
      )}
      {!!contacts?.length && (
        <div className={styles.group}>{contacts.map(renderAccountItem)}</div>
      )}
    </section>
  );
};
