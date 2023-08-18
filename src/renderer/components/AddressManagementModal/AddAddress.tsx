import { useZPopupLayerOnMain } from '@/renderer/hooks/usePopupWinOnMainwin';
import React from 'react';
import styles from './index.module.less';

export const AddAddress: React.FC = () => {
  const { showZSubview, hideZSubview } = useZPopupLayerOnMain();
  return (
    <img
      onClick={() => {
        showZSubview('select-add-address-type-modal');
        hideZSubview('address-management');
      }}
      className={styles.addAddress}
      src="rabby-internal://assets/icons/address-management/wallet.svg"
    />
  );
};
