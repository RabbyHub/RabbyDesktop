import { useCopyAddress } from '@/renderer/hooks/useCopyAddress';
import { ellipsis } from '@/renderer/utils/address';
import {
  KEYRING_ICONS,
  WALLET_BRAND_CONTENT,
  WALLET_BRAND_TYPES,
} from '@/renderer/utils/constant';
import { splitNumberByStep } from '@/renderer/utils/number';
import clsx from 'clsx';
import React from 'react';

export interface Props {
  checked?: boolean;
  data: BundleAccount;
  isBundle?: boolean;
}

export const AccountItem: React.FC<Props> = ({ checked, data, isBundle }) => {
  const brandName = React.useMemo(() => {
    switch (data.type) {
      case 'eth':
        return data.data.brandName as WALLET_BRAND_TYPES;
      case 'bn':
        return WALLET_BRAND_TYPES.Binance;
      case 'btc':
      default:
        return WALLET_BRAND_TYPES.Bitcoin;
    }
  }, [data]);

  const addressTypeIcon = React.useMemo(() => {
    switch (data.type) {
      case 'eth':
        return (
          KEYRING_ICONS[data.data.type] ||
          WALLET_BRAND_CONTENT?.[brandName]?.image
        );

      default:
        return WALLET_BRAND_CONTENT?.[brandName]?.image;
    }
  }, [brandName, data]);

  const displayAddress = React.useMemo(() => {
    switch (data.type) {
      case 'eth':
        return data.data.address;
      case 'bn':
        return data.apiKey;
      case 'btc':
      default:
        return data.address;
    }
  }, [data]);

  const onCopy = useCopyAddress();

  return (
    <div
      className={clsx(
        'group',
        'flex items-center cursor-pointer',
        'rounded-[6px] overflow-hidden hover:bg-[#FFFFFF08] p-[14px]',
        'border border-solid border-[#FFFFFF14] hover:border-[#FFFFFF40]',
        isBundle ? 'bg-[#FFFFFF08] border-none' : ''
      )}
    >
      <div className="mr-[15px]">
        {checked ? (
          <img src="rabby-internal://assets/icons/bundle/checked.svg" />
        ) : (
          <div
            className={clsx(
              'border border-[#FFFFFF4D] group-hover:border-white w-[16px] h-[16px] border-solid rounded-full'
            )}
          />
        )}
      </div>
      <div className="mr-[7px]">
        <img className="w-[22px] h-[22px]" src={addressTypeIcon} alt="" />
      </div>
      <div className={clsx('text-white text-[12px]', 'flex-1 space-y-[6px]')}>
        <div
          className={clsx('font-medium', 'opacity-70 group-hover:opacity-100')}
        >
          {data.nickname}
        </div>
        <div className="flex space-x-[5px] items-center">
          <span className="opacity-50">{ellipsis(displayAddress)}</span>
          <div
            onClick={() => onCopy(displayAddress)}
            className="opacity-60 hover:opacity-100"
          >
            <img
              className="w-[14px]"
              src="rabby-internal://assets/icons/address-management/copy-white.svg"
            />
          </div>
        </div>
      </div>
      <div
        className={clsx(
          'text-white text-[12px]',
          'flex items-end flex-col space-y-[6px]'
        )}
      >
        <div className={clsx('font-medium text-[14px]', 'opacity-70')}>
          ${splitNumberByStep(Number(data.balance)?.toFixed(2))}
        </div>
        <div className="opacity-60">balance</div>
      </div>
    </div>
  );
};
