import React, { useMemo, useRef } from 'react';
import styled from 'styled-components';
import clsx from 'clsx';
import { message, Tooltip } from 'antd';
import { ellipsis, isSameAddress } from '@/renderer/utils/address';
import { IDisplayedAccountWithBalance } from '@/renderer/hooks/rabbyx/useAccountToDisplay';
import { useWhitelist } from '@/renderer/hooks/rabbyx/useWhitelist';
import { copyText } from '@/renderer/utils/clipboard';
import { toastCopiedWeb3Addr } from '@/renderer/components/TransparentToast';
import { KEYRING_ICONS, WALLET_BRAND_CONTENT } from '@/renderer/utils/constant';
import { splitNumberByStep } from '@/renderer/utils/number';

const AccountItemWrapper = styled.div`
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 6px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  flex: 1;
  border: 1px solid transparent;
  color: #ffffff;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0px 6px 16px rgba(0, 0, 0, 0.07);
  }
  .name {
    font-weight: 510;
    font-size: 13px;
    line-height: 16px;
    margin-bottom: 0;
  }
  .address {
    font-weight: 400;
    font-size: 12px;
    line-height: 14px;
    margin: 0;
    display: flex;
    align-items: center;
  }
  .icon-copy {
    width: 14px;
    height: 14px;
    margin-left: 4px;
    cursor: pointer;
  }
  .account-info {
    margin-left: 12px;
  }
  &:nth-last-child(1) {
    margin-bottom: 0;
  }
  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    &:hover {
      background-color: f5f6fa;
      border-color: transparent;
    }
  }
`;

export const AccountItem = ({
  account,
  disabled = false,
  onClick,
}: {
  account: IDisplayedAccountWithBalance;
  disabled?: boolean;
  onClick?(account: IDisplayedAccountWithBalance): void;
}) => {
  const { enable: whitelistEnable, whitelist: whiteList } = useWhitelist();

  const isInWhiteList = useMemo(() => {
    return whiteList.some((e) => isSameAddress(e, account.address));
  }, [whiteList, account.address]);

  const addressElement = useRef(null);
  const handleClickCopy = (e: React.MouseEvent<HTMLImageElement>) => {
    e.stopPropagation();
    copyText(account.address);
    toastCopiedWeb3Addr(account.address);
  };
  const handleClickItem = () => {
    if (disabled) {
      message.error('This address is not whitelisted');
      return;
    }

    onClick?.(account);
  };
  return (
    <AccountItemWrapper
      className={clsx({ disabled, 'cursor-pointer': !disabled && onClick })}
      onClick={handleClickItem}
    >
      <img
        className="icon icon-account-type w-[24px] h-[24px]"
        src={
          WALLET_BRAND_CONTENT[
            account.brandName as keyof typeof WALLET_BRAND_CONTENT
          ]?.image || KEYRING_ICONS[account.type]
        }
      />
      <div className="account-info flex-1 flex flex-col gap-4">
        <div className="name">
          <div className="flex items-center gap-4">
            <span>{account.alianName}</span>
            {onClick && whitelistEnable && isInWhiteList && (
              <Tooltip
                overlayClassName="rectangle"
                placement="top"
                title="Whitelisted address"
              >
                <img
                  src="rabby-internal://assets/icons/send-token/whitelist.svg"
                  className="w-16 h-16"
                />
              </Tooltip>
            )}
          </div>
        </div>
        <div className="address" title={account.address} ref={addressElement}>
          {ellipsis(account.address)}
          <div className="cursor-pointer" onClick={handleClickCopy}>
            <img
              className="icon-copy"
              src="rabby-internal://assets/icons/send-token/copy.svg"
            />
          </div>
        </div>
      </div>
      <div className="text-13  mb-0">
        ${splitNumberByStep(Math.floor(account.balance))}
      </div>
    </AccountItemWrapper>
  );
};

export const AccountItemSelector = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  &:nth-last-child(1) {
    margin-bottom: 0;
  }
`;

export default AccountItem;
