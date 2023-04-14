import { IDisplayedAccountWithBalance } from '@/renderer/hooks/rabbyx/useAccountToDisplay';
import React from 'react';
import clsx from 'clsx';
import { AccountItem } from './AccountItem';
import styles from './index.module.less';

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
      <div className={clsx(styles.group, !accounts?.length && 'hidden')}>
        {accounts.map(renderAccountItem)}
      </div>
      <div className={clsx(styles.group, !contacts?.length && 'hidden')}>
        {contacts.map(renderAccountItem)}
      </div>
    </section>
  );
};
