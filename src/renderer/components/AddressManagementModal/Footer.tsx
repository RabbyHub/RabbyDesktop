import { Button } from 'antd';
import React from 'react';
import styles from './index.module.less';

export const Footer: React.FC = () => {
  return (
    <section className={styles.footer}>
      <Button
        icon={
          <img
            className={styles.icon}
            src="rabby-internal://assets/icons/address-management/wallet.svg"
          />
        }
        className={styles.button}
        onClick={() => {
          // TODO ADD ADDRESS
        }}
      >
        Add address
      </Button>
    </section>
  );
};
