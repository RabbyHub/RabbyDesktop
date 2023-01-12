import { Button } from 'antd';
import { atom, useAtom } from 'jotai';
import React from 'react';
import styles from './AddressManagementDrawer.module.less';

const isAddingAddressAtom = atom(false);

export function useIsAddAddress() {
  const [isAddingAddress, setIsAddingAddress] = useAtom(isAddingAddressAtom);

  return {
    isAddingAddress,
    setIsAddingAddress,
  };
}

export const Footer: React.FC = () => {
  const { setIsAddingAddress } = useIsAddAddress();

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
          setIsAddingAddress(true);
        }}
      >
        Add address
      </Button>
    </section>
  );
};
