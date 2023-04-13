import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { useClickOutSide } from '@/renderer/hooks/useClick';
import {
  useZPopupLayerOnMain,
  useZViewsVisibleChanged,
} from '@/renderer/hooks/usePopupWinOnMainwin';
import {
  hideMainwinPopupview,
  showMainwinPopupview,
} from '@/renderer/ipcRequest/mainwin-popupview';
import {
  KEYRING_ICONS_WHITE,
  WALLET_BRAND_CONTENT,
} from '@/renderer/utils/constant';
import clsx from 'clsx';
import { useMemo, useRef, useState } from 'react';
import {
  ADD_DROPDOWN_LEFT_OFFSET,
  getAddDropdownKeyrings,
} from '../AddAddressDropdown/constants';
import styles from './index.module.less';

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

  if (!currentAccount?.alianName) {
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
        <img className={styles.logo} src={addressTypeIcon} alt="key" />
        <span className={styles.aliasName}>{currentAccount?.alianName}</span>
      </div>
      <div className={styles.dockRight}>
        <span className={styles.addr}>{displayAddr}</span>
      </div>
      <img
        src="rabby-internal://assets/icons/top-bar/select-top.svg"
        className={clsx(
          'transition-transform',
          addressManagementVisible && 'transform rotate-180'
        )}
      />
    </div>
  );
};

const DROPDOWN_POPUP_H =
  getAddDropdownKeyrings().length * 46 + 10 * 12; /* y-paddings */

export const AddNewAccount = ({ className }: { className?: string }) => {
  const divRef = useRef<HTMLDivElement>(null);

  useClickOutSide(divRef, () => {
    hideMainwinPopupview('add-address-dropdown');
  });

  return (
    <div
      className={clsx(styles.addNewAccount, className)}
      ref={divRef}
      onMouseEnter={(evt) => {
        if (!divRef.current) return;
        const pos = divRef.current.getBoundingClientRect();

        // const divRect = (evt.target as HTMLDivElement).getBoundingClientRect();
        showMainwinPopupview({
          type: 'add-address-dropdown',
          triggerRect: {
            x: pos.x - ADD_DROPDOWN_LEFT_OFFSET,
            // y: pos.y + 40, // if you wanna the standalone add-address-dropdown below the add button
            y: pos.y,
            width: 240,
            height: Math.max(300, DROPDOWN_POPUP_H),
          },
        });
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
