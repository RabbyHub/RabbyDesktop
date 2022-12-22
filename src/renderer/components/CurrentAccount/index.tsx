import { useCurrentAccount } from '@/renderer/hooks/useRabbyx';
import clsx from 'clsx';
import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import styles from './index.module.less';

export const CurrentAccount = ({
  onClick,
  className,
}: {
  onClick?: () => void;
  className?: string;
}) => {
  const currentAccount = useCurrentAccount();

  const displayAddr = useMemo(
    () =>
      currentAccount?.address
        ? `${currentAccount?.address.slice(
            0,
            4
          )}...${currentAccount?.address.slice(-4)}`
        : '',
    [currentAccount?.address]
  );
  if (!currentAccount?.alianName) {
    return null;
  }
  return (
    <div className={clsx(styles.account, className)} onClick={onClick}>
      <img
        className={styles.logo}
        src="rabby-internal://assets/icons/import/key.svg"
        alt="key"
      />
      <span className={styles.aliasName}>{currentAccount?.alianName}</span>
      <span className={styles.addr}>
        {displayAddr}
        <img src="rabby-internal://assets/icons/top-bar/select.svg" />
      </span>
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
    <div className={clsx(styles.row, className)}>
      <CurrentAccount />
      <AddNewAccount />
    </div>
  );
};
