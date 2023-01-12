import { IDisplayedAccountWithBalance } from '@/renderer/hooks/rabbyx/useAccountToDisplay';
import React from 'react';
import styles from './AddressManagementDrawer.module.less';

interface Props {
  currentAccount: IDisplayedAccountWithBalance;
}

export const Header: React.FC<Props> = ({ currentAccount }) => {
  return (
    <section className={styles.header}>
      <div>current account</div>
      <div className={styles.divider}>
        <span className={styles.text}>switch address</span>
      </div>
    </section>
  );
};
