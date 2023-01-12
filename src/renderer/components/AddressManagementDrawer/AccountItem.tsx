import { IDisplayedAccountWithBalance } from '@/renderer/hooks/rabbyx/useAccountToDisplay';
import {
  KEYRING_ICONS,
  WALLET_BRAND_CONTENT,
  WALLET_BRAND_TYPES,
} from '@/renderer/utils/constant';
import clsx from 'clsx';
import React from 'react';
import styles from './AddressManagementDrawer.module.less';

interface Props extends IDisplayedAccountWithBalance {
  onClickAction: () => void;
  onClick: React.MouseEventHandler<HTMLDivElement>;
}

export const AccountItem: React.FC<Props> = ({
  onClickAction,
  onClick,
  ...account
}) => {
  const addressTypeIcon = React.useMemo(
    () =>
      KEYRING_ICONS[account.type] ||
      WALLET_BRAND_CONTENT?.[account.brandName as WALLET_BRAND_TYPES]?.image,
    [account]
  );

  return (
    <section onClick={onClick} className={styles.AccountItem}>
      <div className={styles.icon}>
        <img src={addressTypeIcon} alt={account.brandName} />
      </div>
      <div className={styles.content}>
        <div className={clsx(styles.part, styles.partName)}>
          <div className={styles.name}>{account.alianName}</div>
          <div className={styles.index}>#2</div>
          <div className={styles.whitelist}>whitelist</div>
          <div className={styles.pin}>pin</div>
        </div>
        <div className={clsx(styles.part, styles.partAddress)}>
          <div className={styles.address}>{account.address}</div>
          <div className={styles.copy}>copy</div>
          <div className={styles.balance}>{account.balance}</div>
        </div>
      </div>
      <div className={styles.action}>action</div>
    </section>
  );
};
