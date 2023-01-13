import { IDisplayedAccountWithBalance } from '@/renderer/hooks/rabbyx/useAccountToDisplay';
import { ellipsis } from '@/renderer/utils/address';
import {
  KEYRINGS_LOGOS,
  WALLET_BRAND_CONTENT,
  WALLET_BRAND_TYPES,
} from '@/renderer/utils/constant';
import { splitNumberByStep } from '@/renderer/utils/number';
import clsx from 'clsx';
import React from 'react';
import styles from './AddressManagementDrawer.module.less';

interface Props {
  account: IDisplayedAccountWithBalance;
  onClick: React.MouseEventHandler<HTMLDivElement>;
}

export const CurrentAccount: React.FC<Props> = ({ account, onClick }) => {
  const addressTypeIcon = React.useMemo(
    () =>
      WALLET_BRAND_CONTENT?.[account.brandName as WALLET_BRAND_TYPES]?.image ||
      KEYRINGS_LOGOS[account.type],
    [account]
  );

  return (
    <section onClick={onClick} className={styles.CurrentAccount}>
      <div className={styles.icon}>
        <img src={addressTypeIcon} alt={account.brandName} />
      </div>
      <div className={styles.content}>
        <div className={clsx(styles.part, styles.partName)}>
          <div className={styles.name}>{account.alianName}</div>
          {/* <div className={styles.index}>#2</div> */}
          <div className={styles.whitelist}>whitelist</div>
        </div>
        <div className={clsx(styles.part, styles.partAddress)}>
          <div className={styles.address}>{ellipsis(account.address)}</div>
          <div className={styles.copy}>copy</div>
        </div>
      </div>
      <div className={styles.balance}>
        ${splitNumberByStep(account.balance?.toFixed(2))}
      </div>
      <div className={styles.action}>action</div>
    </section>
  );
};
