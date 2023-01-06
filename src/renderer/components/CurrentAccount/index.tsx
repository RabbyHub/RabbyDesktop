import {
  useAccounts,
  useCurrentAccount,
} from '@/renderer/hooks/rabbyx/useAccount';
import { useClickOutSide } from '@/renderer/hooks/useClick';
import {
  hideMainwinPopup,
  showMainwinPopup,
} from '@/renderer/ipcRequest/mainwin-popup';
import clsx from 'clsx';
import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router';
import styles from './index.module.less';

export const CurrentAccount = ({ className }: { className?: string }) => {
  const divRef = useRef<HTMLDivElement>(null);
  useClickOutSide(divRef, () => {
    hideMainwinPopup('switch-account');
  });
  const { currentAccount } = useCurrentAccount();
  const { accounts } = useAccounts();

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
      ref={divRef}
      onClick={(event) => {
        const el = event.currentTarget as HTMLDivElement;
        const rect = el.getBoundingClientRect();

        showMainwinPopup(
          {
            x: rect.x,
            y: rect.bottom + 10,
            height: Math.min(accounts.length, 6) * (60 + 3) - 1,
          },
          {
            type: 'switch-account',
          }
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
        <img
          className={styles.dropdownIcon}
          src="rabby-internal://assets/icons/top-bar/select.svg"
        />
      </div>
    </div>
  );
};

export const AddNewAccount = ({ className }: { className?: string }) => {
  const navigate = useNavigate();
  const gotoAddNewAccount = () => {
    navigate('/import-by/private-key');
  };
  return (
    <div
      className={clsx(styles.addNewAccount, className)}
      onClick={gotoAddNewAccount}
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
