import { useZPopupLayerOnMain } from '@/renderer/hooks/usePopupWinOnMainwin';
import { Button } from 'antd';
import React from 'react';
import styles from './index.module.less';

export const Footer: React.FC = () => {
  const { showZSubview, hideZSubview } = useZPopupLayerOnMain();
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
          showZSubview('select-add-address-type-modal');
          hideZSubview('address-management');
        }}
      >
        New Address
      </Button>
    </section>
  );
};
