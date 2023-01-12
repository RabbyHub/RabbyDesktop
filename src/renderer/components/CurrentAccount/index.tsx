import {
  useAccounts,
  useCurrentAccount,
} from '@/renderer/hooks/rabbyx/useAccount';
import { useClickOutSide } from '@/renderer/hooks/useClick';
import {
  hideMainwinPopup,
  showMainwinPopup,
} from '@/renderer/ipcRequest/mainwin-popup';
import { showMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import clsx from 'clsx';
import { useMemo, useRef, useState } from 'react';
import { AddressManagementDrawer } from '../AddressManagementDrawer/AddressManagementDrawer';
import styles from './index.module.less';

export const CurrentAccount = ({ className }: { className?: string }) => {
  const [visible, setVisible] = useState(false);
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
  if (!currentAccount?.alianName) {
    return null;
  }
  return (
    <>
      <div
        className={clsx(styles.account, className)}
        onClick={(event) => {
          setVisible(true);
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
          <img
            className={styles.dropdownIcon}
            src="rabby-internal://assets/icons/top-bar/select.svg"
          />
        </div>
      </div>
      <AddressManagementDrawer
        visible={visible}
        onClose={() => setVisible(false)}
      />
    </>
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
      <AddNewAccount />
    </div>
  );
};
