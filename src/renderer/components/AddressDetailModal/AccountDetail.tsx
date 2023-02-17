/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import {
  IDisplayedAccountWithBalance,
  useAccountToDisplay,
} from '@/renderer/hooks/rabbyx/useAccountToDisplay';
import { useCopyToClipboard } from 'react-use';
import { splitNumberByStep } from '@/renderer/utils/number';
import {
  KEYRING_ICONS,
  WALLET_BRAND_CONTENT,
  WALLET_BRAND_TYPES,
} from '@/renderer/utils/constant';
import { useAddressSource } from '@/renderer/hooks/rabbyx/useAddressSource';
import QRCode from 'qrcode.react';
import { Input, Popover } from 'antd';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { useForwardTo } from '@/renderer/hooks/useViewsMessage';
import styles from './index.module.less';
import { AccountDetailItem } from './AccountDetailItem';
import { useAccountInfo } from '../AddressManagementModal/useAccountInfo';

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
  const [editing, setEditing] = React.useState(false);
  const [aliasInput, setAliasInput] = React.useState('');
  const { getAllAccountsToDisplay } = useAccountToDisplay();
  const accountInfo = useAccountInfo(account.type, account.address);

  const broadcastToViews = useForwardTo('*');

  const updateAliasName = React.useCallback(
    async (e: any) => {
      const { value: inputValue } = e.target as { value: string };
      setEditing(false);

      if (!inputValue) {
        return;
      }

      setAliasInput(inputValue);
      await walletController.updateAlianName(account.address, inputValue);
      broadcastToViews('refreshCurrentAccount', {});
      getAllAccountsToDisplay();
    },
    [account.address, walletController, broadcastToViews]
  );

  React.useEffect(() => {
    setAliasInput(account.alianName);
  }, []);

  return (
    <div className={styles.AccountDetail}>
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
          {editing ? (
            <Input
              className="alias-input"
              defaultValue={aliasInput}
              onBlur={updateAliasName}
              onPressEnter={updateAliasName}
              autoFocus
            />
          ) : (
            <div onClick={() => setEditing(true)} className={styles.editNote}>
              <span className={styles.addressNote}>{aliasInput}</span>
              <img
                className={styles.icon}
                src="rabby-internal://assets/icons/address-management/pen.svg"
              />
            </div>
          )}
        </AccountDetailItem>
        <AccountDetailItem headline="Assets">
          <span> ${splitNumberByStep(account.balance?.toFixed(2))}</span>
        </AccountDetailItem>
        <AccountDetailItem headline="QR Code">
          <Popover
            placement="bottomLeft"
            // trigger="click"
            overlayClassName="page-address-detail-qrcode-popover"
            align={{
              offset: [-16, 6],
            }}
            content={<QRCode value={account.address} size={140} />}
          >
            <QRCode
              value={account.address}
              size={28}
              className="cursor-pointer"
            />
          </Popover>
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
        {accountInfo && (
          <AccountDetailItem headline="HD Path">
            {`${accountInfo.hdPathTypeLabel} #${accountInfo.index}`}
          </AccountDetailItem>
        )}
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
