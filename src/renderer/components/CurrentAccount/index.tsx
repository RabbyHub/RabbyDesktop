import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import useCurrentBalance from '@/renderer/hooks/useCurrentBalance';
import { showMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import { formatNumber } from '@/renderer/utils/number';
import {
  KEYRING_ICONS_WHITE,
  WALLET_BRAND_CONTENT,
} from '@/renderer/utils/constant';
import clsx from 'clsx';
import { useMemo } from 'react';
import styles from './index.module.less';

export const CurrentAccount = ({ className }: { className?: string }) => {
  const { currentAccount } = useCurrentAccount();
  const [balance] = useCurrentBalance(currentAccount?.address);
  const addressTypeIcon = useMemo(() => {
    if (!currentAccount?.type) return '';
    return (
      KEYRING_ICONS_WHITE[currentAccount.type] ||
      WALLET_BRAND_CONTENT[
        currentAccount.brandName as keyof typeof WALLET_BRAND_CONTENT
      ]?.image
    );
  }, [currentAccount]);
  const displayAddr = useMemo(
    () =>
      currentAccount?.address
        ? `${currentAccount?.address.slice(
            0,
            6
          )}...${currentAccount?.address.slice(-4)}`
        : '',
    [currentAccount?.address]
  );

  if (!currentAccount?.alianName) {
    return null;
  }

  return (
    <div
      className={clsx(styles.account, className)}
      onClick={() => {
        showMainwinPopupview(
          { type: 'address-management' },
          { openDevTools: false }
        );
      }}
    >
      <div className={styles.content}>
        <img className={styles.logo} src={addressTypeIcon} alt="key" />
        <span className={styles.aliasName}>{currentAccount?.alianName}</span>
      </div>
      <div className={styles.dockRight}>
        <span className={styles.addr}>{displayAddr}</span>

        <span className={styles.balance}>${formatNumber(balance || 0)}</span>
      </div>
    </div>
  );
};

export const AddNewAccount = ({ className }: { className?: string }) => {
  return (
    <div
      className={clsx(styles.addNewAccount, className)}
      onClick={() => {
        showMainwinPopupview({ type: 'add-address' }, { openDevTools: false });
      }}
    >
      <img src="rabby-internal://assets/icons/top-bar/add-address.svg" />
    </div>
  );
};

export const CurrentAccountAndNewAccount = ({
  className,
}: {
  className?: string;
}) => {
  return (
    <div className={clsx(styles.row, className)} data-nodrag>
      <CurrentAccount />
      {/* <AddNewAccount /> */}
    </div>
  );
};
