import { showMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import { Button } from 'antd';
import React from 'react';
import styles from './AddressManagementDrawer.module.less';

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
          showMainwinPopupview(
            { type: 'add-address' },
            { openDevTools: false }
          );
        }}
      >
        Add address
      </Button>
    </section>
  );
};
