import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import {
  useZPopupLayerOnMain,
  useZViewsVisibleChanged,
} from '@/renderer/hooks/usePopupWinOnMainwin';

import {
  KEYRING_ICONS_WHITE,
  WALLET_BRAND_CONTENT,
} from '@/renderer/utils/constant';
import clsx from 'clsx';
import { useMemo, useRef, useState } from 'react';

import styles from './index.module.less';
import { SignalBridge } from '../ConnectStatus/SignalBridge';

export const CurrentAccount = ({ className }: { className?: string }) => {
  const { currentAccount } = useCurrentAccount();
  const addressTypeIcon = useMemo(() => {
    if (!currentAccount?.type) return '';
    return (
      KEYRING_ICONS_WHITE[currentAccount.type] ||
      WALLET_BRAND_CONTENT[
        currentAccount.brandName as keyof typeof WALLET_BRAND_CONTENT
      ]?.image
    );
  }, [currentAccount]);
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
  const zActions = useZPopupLayerOnMain();

  const [addressManagementVisible, setAddressManagementVisible] =
    useState(false);

  useZViewsVisibleChanged((visibles) => {
    setAddressManagementVisible(visibles['address-management']);
  });

  if (!currentAccount) {
    return null;
  }

  return (
    <div
      className={clsx(styles.account, className)}
      onClick={() => {
        zActions.showZSubview('address-management');
      }}
    >
      <div className={styles.content}>
        <div className={styles.logo}>
          <img className="w-full" src={addressTypeIcon} alt="key" />
          <SignalBridge {...currentAccount} />
        </div>
        <span className={styles.aliasName}>{currentAccount?.alianName}</span>
      </div>
      <div className={styles.dockRight}>
        <span className={styles.addr}>{displayAddr}</span>
      </div>
      <img
        src="rabby-internal://assets/icons/top-bar/select-top.svg"
        className={clsx(
          'transition-transform',
          !addressManagementVisible && 'transform rotate-180'
        )}
      />
    </div>
  );
};

export const AddNewAccount = ({ className }: { className?: string }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const { showZSubview, hideZSubview } = useZPopupLayerOnMain();

  return (
    <div
      className={clsx(styles.addNewAccount, className)}
      ref={divRef}
      onClick={() => {
        showZSubview('select-add-address-type-modal');
        hideZSubview('address-management');
      }}
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
      <AddNewAccount />
      <CurrentAccount />
    </div>
  );
};
