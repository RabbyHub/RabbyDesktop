import React from 'react';
import { AddressItem } from '@/renderer/components/AddressItem/AddressItem';
import { Button } from 'antd';
import styles from './index.module.less';

type Account = import('@/isomorphic/types/rabbyx').Account;

export interface Props {
  onSuccess: () => void;
  accounts?: Account[];
  children?: React.ReactNode;
  title?: string;
}

export const SuccessContent: React.FC<Props> = ({
  accounts,
  onSuccess,
  children,
  title = 'Imported Successfully',
}) => {
  return (
    <div className={styles.ImportSuccessful}>
      <div className={styles.container}>
        <div className={styles.iconWrap}>
          <img
            src="rabby-internal://assets/icons/import/firework.svg"
            alt="successful"
            className={styles.icon}
          />
        </div>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.addressList}>
          {children ??
            accounts?.map((account: any) => (
              <AddressItem {...account} key={account.address} />
            ))}
        </div>

        <Button
          className="w-[240px] h-[52px]"
          type="primary"
          onClick={onSuccess}
        >
          Done
        </Button>
      </div>
    </div>
  );
};
