import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';

import { showMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import { splitNumberByStep } from '@/renderer/utils/number';
import clsx from 'clsx';
import { useMemo } from 'react';
import styles from './index.module.less';

export const CurrentAccount = ({ className }: { className?: string }) => {
  const { currentAccount } = useCurrentAccount();
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

  const balance = useMemo(() => {
    return currentAccount?.balance
      ? splitNumberByStep(currentAccount?.balance.toFixed(2))
      : undefined;
  }, [currentAccount?.balance]);
  if (!currentAccount?.alianName) {
    return null;
  }

  console.log(currentAccount);
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
        <img
          className={styles.logo}
          src="rabby-internal://assets/icons/wallet/private-key.svg"
          alt="key"
        />
        <span className={styles.aliasName}>{currentAccount?.alianName}</span>
      </div>
      <div className={styles.dockRight}>
        <span className={styles.addr}>{displayAddr}</span>

        {balance && <span className={styles.balance}>${balance}</span>}
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
