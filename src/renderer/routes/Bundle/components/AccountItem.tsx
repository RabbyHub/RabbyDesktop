import { ellipsis } from '@/renderer/utils/address';
import {
  KEYRING_ICONS,
  WALLET_BRAND_CONTENT,
  WALLET_BRAND_TYPES,
} from '@/renderer/utils/constant';
import { splitNumberByStep } from '@/renderer/utils/number';
import classNames from 'classnames';
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
        return ellipsis(data.data.address);
      case 'bn':
        return ellipsis(data.apiKey);
      case 'btc':
      default:
        return ellipsis(data.address);
    }
  }, [data]);

  return (
    <div
      className={classNames(
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
            className={classNames(
              'border border-[#FFFFFF4D] group-hover:border-white w-[16px] h-[16px] border-solid rounded-full'
            )}
          />
        )}
      </div>
      <div className="mr-[7px]">
        <img className="w-[22px] h-[22px]" src={addressTypeIcon} alt="" />
      </div>
      <div
        className={classNames('text-white text-[12px]', 'flex-1 space-y-[6px]')}
      >
        <div
          className={classNames(
            'font-medium',
            'opacity-70 group-hover:opacity-100'
          )}
        >
          {data.nickname}
        </div>
        <div className="opacity-50">{displayAddress}</div>
      </div>
      <div
        className={classNames(
          'text-white text-[12px]',
          'flex items-end flex-col space-y-[6px]'
        )}
      >
        <div className={classNames('font-medium text-[14px]', 'opacity-70')}>
          ${splitNumberByStep(Number(data.balance)?.toFixed(2))}
        </div>
        <div className="opacity-60">balance</div>
      </div>
    </div>
  );
};
