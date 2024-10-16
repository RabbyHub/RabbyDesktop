import { IDisplayedAccountWithBalance } from '@/renderer/hooks/rabbyx/useAccountToDisplay';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from 'antd';
import clsx from 'clsx';
import { AccountItem } from './AccountItem';
import styles from './index.module.less';

interface Props {
  accounts: IDisplayedAccountWithBalance[];
  contacts: IDisplayedAccountWithBalance[];
  onSelect: (account: IDisplayedAccountWithBalance) => void;
  onSwitchAccount: (account: IDisplayedAccountWithBalance) => void;
  onDelete: (account: IDisplayedAccountWithBalance) => void;
  isUpdatingBalance?: boolean;
  onAddress: () => void;
}

export const Body: React.FC<Props> = ({
  accounts,
  contacts,
  onSelect,
  onSwitchAccount,
  onDelete,
  onAddress,
  isUpdatingBalance,
}) => {
  const { t } = useTranslation();

  const renderAccountItem = React.useCallback(
    (account: IDisplayedAccountWithBalance) => {
      return (
        <AccountItem
          onClickAction={(e) => {
            e.stopPropagation();
            onSelect(account);
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSwitchAccount(account);
          }}
          onClickDelete={(e) => {
            e.stopPropagation();
            onDelete(account);
          }}
          account={account}
          key={account.address + account.type + account.brandName}
          isUpdatingBalance={isUpdatingBalance}
        />
      );
    },
    [isUpdatingBalance, onDelete, onSelect, onSwitchAccount]
  );

  return (
    <section className={styles.body}>
      {!!accounts?.length && (
        <div className={styles.group}>{accounts.map(renderAccountItem)}</div>
      )}
      {!!contacts?.length && (
        <div className={styles.group}>{contacts.map(renderAccountItem)}</div>
      )}
      <div className={clsx(styles.group, 'w-full mt-auto px-20')}>
        <Button
          onClick={onAddress}
          block
          size="large"
          type="primary"
          className="h-[52px] w-[360px] bg-r-neutral-card1 text-13 font-medium rounded-[8px] text-r-blue-default border-0"
        >
          {t('page.manageAddress.add-new-address')}
        </Button>
      </div>
    </section>
  );
};
