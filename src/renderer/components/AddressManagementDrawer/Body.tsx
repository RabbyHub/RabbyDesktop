import { IDisplayedAccountWithBalance } from '@/renderer/hooks/rabbyx/useAccountToDisplay';
import React from 'react';
import { AccountItem } from './AccountItem';
import styles from './AddressManagementDrawer.module.less';

interface Props {
  accounts: IDisplayedAccountWithBalance[];
  contacts: IDisplayedAccountWithBalance[];
  onSelect: (account: IDisplayedAccountWithBalance) => void;
  onSwitchAccount: (account: IDisplayedAccountWithBalance) => void;
  onDelete: (account: IDisplayedAccountWithBalance) => void;
}

export const Body: React.FC<Props> = ({
  accounts,
  contacts,
  onSelect,
  onSwitchAccount,
  onDelete,
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
          key={account.address + account.type}
        />
      );
    },
    [onDelete, onSelect, onSwitchAccount]
  );

  return (
    <section className={styles.body}>
      <div className={styles.group}>{accounts.map(renderAccountItem)}</div>
      <div className={styles.group}>{contacts.map(renderAccountItem)}</div>
    </section>
  );
};
