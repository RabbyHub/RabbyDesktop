import { useBundle } from '@/renderer/hooks/useBundle/useBundle';
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
  canEdit?: boolean;
  canDelete?: boolean;
}

export const AccountItem: React.FC<Props> = ({
  checked,
  data,
  isBundle,
  canEdit,
  canDelete,
}) => {
  const {
    account: { toggleBundle, updateNickname, remove },
  } = useBundle();
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
  const onClickEdit = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!canEdit) return;
      e.stopPropagation();
      console.log(123);
    },
    [canEdit]
  );
  const onClickDelete = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (data.id) {
        remove(data.id);
      }
    },
    [remove, data]
  );

  const onClick = React.useCallback(() => {
    toggleBundle(data);
  }, [toggleBundle, data]);

  return (
    <div className="flex justify-center items-center relative">
      {canDelete && (
        <div
          onClick={onClickDelete}
          className={clsx(
            'absolute left-[-21px]',
            'opacity-0 hover:opacity-80 cursor-pointer'
          )}
        >
          <img src="rabby-internal://assets/icons/bundle/trash.svg" />
        </div>
      )}

      <div
        onClick={onClick}
        className={clsx(
          'relative',
          'group flex items-center cursor-pointer',
          'h-[66px] w-full',
          'rounded-[6px] hover:bg-[#FFFFFF08] p-[14px]',
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
            className={clsx(
              'flex items-center space-x-[3px]',
              'font-medium text-[12px] leading-[16px]',
              'opacity-70',
              canEdit && 'group-hover:opacity-100',
              'group'
            )}
            onClick={onClickEdit}
          >
            <span>{data.nickname}</span>
            {canEdit && (
              <img
                className={clsx(
                  'group-hover:block hidden',
                  'opacity-70 hover:opacity-100'
                )}
                src="rabby-internal://assets/icons/bundle/edit.svg"
              />
            )}
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
            'h-full',
            'text-white text-[12px]',
            'flex items-end flex-col space-y-[6px] justify-start'
          )}
        >
          <div
            className={clsx('font-medium text-[12px]', 'opacity-70', {
              hidden: data.balance === undefined,
            })}
          >
            ${splitNumberByStep(Number(data.balance)?.toFixed(2))}
          </div>
          {isBundle && <div className="opacity-60">balance</div>}
        </div>
      </div>
    </div>
  );
};
