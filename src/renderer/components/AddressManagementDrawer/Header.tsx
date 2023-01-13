import { IDisplayedAccountWithBalance } from '@/renderer/hooks/rabbyx/useAccountToDisplay';
import React from 'react';
import styles from './AddressManagementDrawer.module.less';
import { CurrentAccount } from './CurrentAddress';

interface Props {
  currentAccount?: IDisplayedAccountWithBalance;
}

export const Header: React.FC<Props> = ({ currentAccount }) => {
  return (
    <section className={styles.header}>
      <CurrentAccount account={currentAccount} />
      <div className={styles.divider}>
        <span className={styles.text}>switch address</span>
      </div>
    </section>
  );
};
