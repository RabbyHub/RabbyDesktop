import React from 'react';
import { IDisplayedAccountWithBalance } from '@/renderer/hooks/rabbyx/useAccountToDisplay';
import { useCopyToClipboard } from 'react-use';
import { splitNumberByStep } from '@/renderer/utils/number';
import {
  KEYRING_ICONS,
  WALLET_BRAND_CONTENT,
  WALLET_BRAND_TYPES,
} from '@/renderer/utils/constant';
import { useAddressSource } from '@/renderer/hooks/rabbyx/useAddressSource';
import styles from './AddressManagementDrawer.module.less';
import { AccountDetailItem } from './AccountDetailItem';

export interface Props {
  onClose: () => void;
  account: IDisplayedAccountWithBalance;
  onDelete: (account: IDisplayedAccountWithBalance) => void;
}

export const AccountDetail: React.FC<Props> = ({
  onClose,
  onDelete,
  account,
}) => {
  const brandName = account.brandName as WALLET_BRAND_TYPES;
  const [, copyToClipboard] = useCopyToClipboard();
  const onCopy = React.useCallback(() => {
    copyToClipboard(account.address);
  }, [account.address, copyToClipboard]);

  const source = useAddressSource({
    type: account.type,
    brandName,
    byImport: !!account.byImport,
  });

  return (
    <div className={styles.AccountDetail}>
      <header className={styles.header}>
        <div onClick={onClose} className={styles.back}>
          <img src="rabby-internal://assets/icons/modal/back.svg" />
        </div>
        <span className={styles.title}>Address detail</span>
      </header>
      <section className={styles.part}>
        <AccountDetailItem
          headline="Address"
          description={
            <div className={styles.address}>
              <span className={styles.text}>{account.address}</span>
              <img
                className={styles.copy}
                onClick={onCopy}
                src="rabby-internal://assets/icons/address-management/copy.svg"
              />
            </div>
          }
        />
        <AccountDetailItem headline="Address Note">
          <div className={styles.editNote}>
            <span className={styles.addressNote}>{account.alianName}</span>
            <img src="rabby-internal://assets/icons/address-management/pen.svg" />
          </div>
        </AccountDetailItem>
        <AccountDetailItem headline="Assets">
          <span> ${splitNumberByStep(account.balance?.toFixed(2))}</span>
        </AccountDetailItem>
        <AccountDetailItem headline="QR Code">
          <img src="rabby-internal://assets/icons/address-management/qrcode.svg" />
        </AccountDetailItem>
        <AccountDetailItem headline="Source">
          <div className={styles.source}>
            <img
              src={
                KEYRING_ICONS[account.type] ||
                WALLET_BRAND_CONTENT[brandName]?.image
              }
            />
            <span className={styles.text}>{source}</span>
          </div>
        </AccountDetailItem>
        <AccountDetailItem headline="HD Path">HD Path</AccountDetailItem>
      </section>
      <section className={styles.part}>
        <AccountDetailItem
          onClick={() => onDelete(account)}
          className={styles.deleteAddress}
          headline="Delete Address"
        >
          <img src="rabby-internal://assets/icons/address-management/next.svg" />
        </AccountDetailItem>
      </section>
    </div>
  );
};
