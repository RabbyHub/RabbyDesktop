import { IDisplayedAccountWithBalance } from '@/renderer/hooks/rabbyx/useAccountToDisplay';
import React from 'react';
import styles from './index.module.less';
import { CurrentAccount } from './CurrentAddress';

interface Props {
  currentAccount?: IDisplayedAccountWithBalance;
  onSelect: (account: IDisplayedAccountWithBalance) => void;
  isUpdatingBalance?: boolean;
}

export const Header: React.FC<Props> = ({
  currentAccount,
  onSelect,
  isUpdatingBalance,
}) => {
  return (
    <section className={styles.header}>
      {currentAccount && (
        <CurrentAccount
          onClick={(e) => {
            e.stopPropagation();
            onSelect(currentAccount);
          }}
          account={currentAccount}
          isUpdatingBalance={isUpdatingBalance}
        />
      )}
    </section>
  );
};
