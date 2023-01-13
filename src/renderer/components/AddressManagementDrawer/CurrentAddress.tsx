import { IDisplayedAccountWithBalance } from '@/renderer/hooks/rabbyx/useAccountToDisplay';
import { ellipsis } from '@/renderer/utils/address';
import clsx from 'clsx';
import React from 'react';
import styles from './AddressManagementDrawer.module.less';

interface Props {
  account?: IDisplayedAccountWithBalance;
  onClick: React.MouseEventHandler<HTMLDivElement>;
}

export const CurrentAccount: React.FC<Props> = ({ account, onClick }) => {
  if (!account) {
    return null;
  }

  return (
    <section className={styles.CurrentAccount}>
      <div className={styles.icon}>icon</div>
      <div className={styles.content}>
        <div className={clsx(styles.part, styles.partName)}>
          <div className={styles.name}>{account.alianName}</div>
          <div className={styles.index}>#2</div>
          <div className={styles.whitelist}>whitelist</div>
        </div>
        <div className={clsx(styles.part, styles.partAddress)}>
          <div className={styles.address}>{ellipsis(account.address)}</div>
          <div className={styles.copy}>copy</div>
        </div>
      </div>
      <div className={styles.balance}>{account.balance}</div>
      <div className={styles.action}>action</div>
    </section>
  );
};
