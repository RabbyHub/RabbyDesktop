import { IDisplayedAccountWithBalance } from '@/renderer/hooks/rabbyx/useAccountToDisplay';
import { useWhitelist } from '@/renderer/hooks/rabbyx/useWhitelist';
import { ellipsis, isSameAddress } from '@/renderer/utils/address';
import {
  KEYRINGS_LOGOS,
  KEYRING_CLASS,
  KEYRING_TYPE_TEXT,
  WALLET_BRAND_CONTENT,
  WALLET_BRAND_TYPES,
} from '@/renderer/utils/constant';
import { coerceInteger, splitNumberByStep } from '@/renderer/utils/number';
import { Skeleton, Tooltip } from 'antd';
import clsx from 'clsx';
import React from 'react';
import { useCopyToClipboard } from 'react-use';
import styles from './index.module.less';
import { useAccountInfo } from './useAccountInfo';
import { TipsWrapper } from '../TipWrapper';
import { SignalBridge } from '../ConnectStatus/SignalBridge';
import { SessionStatusBar } from '../WalletConnect/SessionStatusBar';
import { GridPlusStatusBar } from '../ConnectStatus/GridPlusStatusBar';
import { LedgerStatusBar } from '../ConnectStatus/LedgerStatusBar';

interface Props {
  account: IDisplayedAccountWithBalance;
  onClick: React.MouseEventHandler<HTMLDivElement>;
  isUpdatingBalance?: boolean;
}

export const CurrentAccount: React.FC<Props> = ({
  account,
  onClick,
  isUpdatingBalance,
}) => {
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
    },
    [account.address, copyToClipboard]
  );

  return (
    <section onClick={onClick} className={styles.CurrentAccount}>
      <div className="flex items-center">
        <div className={styles.logo}>
          <img
            className="w-24 h-24"
            src={addressTypeIcon}
            alt={account.brandName}
          />
          <SignalBridge {...account} className="right-[0px] bottom-[0px]" />
        </div>
        <div className={styles.content}>
          <div className={clsx(styles.part, styles.partName)}>
            <div className={styles.name}>{account.alianName}</div>
            {accountInfo && !!coerceInteger(accountInfo.index) && (
              <div className={styles.index}>
                #{coerceInteger(accountInfo.index)}
              </div>
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
            <TipsWrapper hoverTips="Copy" clickTips="Copied">
              <div onClick={onCopy} className={clsx(styles.copy, styles.icon)}>
                <img src="rabby-internal://assets/icons/address-management/copy-white.svg" />
              </div>
            </TipsWrapper>
          </div>
        </div>
        <div className={styles.balance}>
          {isUpdatingBalance ? (
            <Skeleton.Input
              active
              style={{
                width: 96,
                height: 24,
                borderRadius: 2,
              }}
            />
          ) : (
            <>${splitNumberByStep(account.balance?.toFixed(2))}</>
          )}
        </div>
        <div className={styles.action}>
          <img
            className={styles.arrow}
            src="rabby-internal://assets/icons/address-management/arrow-right-white.svg"
          />
        </div>
      </div>

      {account.type === KEYRING_CLASS.WALLETCONNECT && (
        <SessionStatusBar
          address={account.address || ''}
          brandName={account.brandName || ''}
          className="mt-[12px] text-white bg-[#0000001A]"
        />
      )}
      {account.type === KEYRING_CLASS.HARDWARE.LEDGER && (
        <LedgerStatusBar className="mt-[12px] text-white bg-[#0000001A]" />
      )}
      {account.type === KEYRING_CLASS.HARDWARE.GRIDPLUS && (
        <GridPlusStatusBar className="mt-[12px] text-white bg-[#0000001A]" />
      )}
    </section>
  );
};
