import { IDisplayedAccountWithBalance } from '@/renderer/hooks/rabbyx/useAccountToDisplay';
import { useWhitelist } from '@/renderer/hooks/rabbyx/useWhitelist';
import { ellipsis, isSameAddress } from '@/renderer/utils/address';
import {
  KEYRINGS_LOGOS,
  KEYRING_TYPE_TEXT,
  WALLET_BRAND_CONTENT,
  WALLET_BRAND_TYPES,
} from '@/renderer/utils/constant';
import { splitNumberByStep } from '@/renderer/utils/number';
import { Tooltip } from 'antd';
import clsx from 'clsx';
import React from 'react';
import { useCopyToClipboard } from 'react-use';
import { toastCopiedWeb3Addr } from '../TransparentToast';
import styles from './index.module.less';
import { useAccountInfo } from './useAccountInfo';

interface Props {
  account: IDisplayedAccountWithBalance;
  onClick: React.MouseEventHandler<HTMLDivElement>;
}

export const CurrentAccount: React.FC<Props> = ({ account, onClick }) => {
  const { whitelist, enable } = useWhitelist();
  const brandName = account.brandName as WALLET_BRAND_TYPES;
  const accountInfo = useAccountInfo(account.type, account.address);

  const isInWhitelist = React.useMemo(() => {
    return enable && whitelist.some((e) => isSameAddress(e, account.address));
  }, [enable, whitelist, account.address]);

  const formatAddressTooltip = React.useMemo(() => {
    if (KEYRING_TYPE_TEXT[account.type]) {
      return KEYRING_TYPE_TEXT[account.type];
    }
    if (WALLET_BRAND_CONTENT[brandName]) {
      return WALLET_BRAND_CONTENT[brandName].name;
    }
    return '';
  }, [account.type, brandName]);

  const addressTypeIcon = React.useMemo(
    () =>
      WALLET_BRAND_CONTENT?.[account.brandName as WALLET_BRAND_TYPES]?.image ||
      KEYRINGS_LOGOS[account.type],
    [account]
  );
  const [, copyToClipboard] = useCopyToClipboard();

  const onCopy = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      copyToClipboard(account.address);
      toastCopiedWeb3Addr(account.address);
    },
    [account.address, copyToClipboard]
  );

  return (
    <section onClick={onClick} className={styles.CurrentAccount}>
      <div className={styles.logo}>
        <img src={addressTypeIcon} alt={account.brandName} />
      </div>
      <div className={styles.content}>
        <div className={clsx(styles.part, styles.partName)}>
          <div className={styles.name}>{account.alianName}</div>
          {accountInfo && (
            <div className={styles.index}>#{accountInfo.index}</div>
          )}
          {isInWhitelist && (
            <Tooltip
              overlayClassName="rectangle"
              placement="top"
              title="Whitelisted address"
            >
              <div className={styles.whitelist}>
                <img
                  width={16}
                  src="rabby-internal://assets/icons/address-management/whitelist-white.svg"
                />
              </div>
            </Tooltip>
          )}
        </div>
        <div className={clsx(styles.part, styles.partAddress)}>
          <div title={formatAddressTooltip} className={styles.address}>
            {ellipsis(account.address)}
          </div>
          <div onClick={onCopy} className={clsx(styles.copy, styles.icon)}>
            <img src="rabby-internal://assets/icons/address-management/copy-white.svg" />
          </div>
        </div>
      </div>
      <div className={styles.balance}>
        ${splitNumberByStep(account.balance?.toFixed(2))}
      </div>
      <div className={styles.action}>
        <img
          className={styles.arrow}
          src="rabby-internal://assets/icons/address-management/arrow-right-white.svg"
        />
      </div>
    </section>
  );
};
