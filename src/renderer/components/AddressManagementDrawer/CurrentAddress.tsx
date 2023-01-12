import clsx from 'clsx';
import React from 'react';
import styles from './AddressManagementDrawer.module.less';

interface Props extends Account {
  onClick: React.MouseEventHandler<HTMLDivElement>;
}

export const CurrentAccount: React.FC<Props> = ({ type, onClick }) => {
  return (
    <section className={styles.CurrentAccount}>
      <div className={styles.icon}>icon</div>
      <div className={styles.content}>
        <div className={clsx(styles.part, styles.partName)}>
          <div className={styles.name}>Ledger</div>
          <div className={styles.index}>#2</div>
          <div className={styles.whitelist}>whitelist</div>
        </div>
        <div className={clsx(styles.part, styles.partAddress)}>
          <div className={styles.address}>address</div>
          <div className={styles.copy}>copy</div>
        </div>
      </div>
      <div className={styles.balance}>balance</div>
      <div className={styles.action}>action</div>
    </section>
  );
};
