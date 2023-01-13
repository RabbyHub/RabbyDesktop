import { IDisplayedAccountWithBalance } from '@/renderer/hooks/rabbyx/useAccountToDisplay';
import React from 'react';
import styles from './AddressManagementDrawer.module.less';
import { CurrentAccount } from './CurrentAddress';

interface Props {
  currentAccount?: IDisplayedAccountWithBalance;
  onSelect: (account: IDisplayedAccountWithBalance) => void;
}

export const Header: React.FC<Props> = ({ currentAccount, onSelect }) => {
  return (
    <section className={styles.header}>
      {currentAccount && (
        <CurrentAccount
          onClick={() => onSelect(currentAccount)}
          account={currentAccount}
        />
      )}
      <div className={styles.divider}>
        <span className={styles.text}>switch address</span>
      </div>
    </section>
  );
};
