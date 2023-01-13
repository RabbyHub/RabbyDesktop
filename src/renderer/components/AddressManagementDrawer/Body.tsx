import { IDisplayedAccountWithBalance } from '@/renderer/hooks/rabbyx/useAccountToDisplay';
import React from 'react';
import { AccountItem } from './AccountItem';
import styles from './AddressManagementDrawer.module.less';

interface Props {
  accounts: IDisplayedAccountWithBalance[];
  contacts: IDisplayedAccountWithBalance[];
  onSelect: (account: IDisplayedAccountWithBalance) => void;
  onSwitchAccount: (account: IDisplayedAccountWithBalance) => void;
}

export const Body: React.FC<Props> = ({
  accounts,
  contacts,
  onSelect,
  onSwitchAccount,
}) => {
  return (
    <section className={styles.body}>
      <div className={styles.group}>
        {accounts.map((account) => (
          <AccountItem
            onClickAction={() => onSelect(account)}
            onClick={() => onSwitchAccount(account)}
            account={account}
            key={account.address + account.type}
          />
        ))}
      </div>
      <div className={styles.group}>
        {contacts.map((contact) => (
          <AccountItem
            onClickAction={() => onSelect(contact)}
            onClick={() => onSwitchAccount(contact)}
            account={contact}
            key={contact.address + contact.type}
          />
        ))}
      </div>
    </section>
  );
};
