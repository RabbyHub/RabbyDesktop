import { useBundle } from '@/renderer/hooks/useBundle/useBundle';
import { useCopy } from '@/renderer/hooks/useCopy';
import { ellipsis } from '@/renderer/utils/address';
import { splitNumberByStep } from '@/renderer/utils/number';
import clsx from 'clsx';
import React from 'react';
import { useAccountItemAddress, useAccountItemIcon } from './useAccountItem';
import { NicknameInput } from './NicknameInput';

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
    account: { toggleBundle, remove, percentMap },
  } = useBundle();
  const addressTypeIcon = useAccountItemIcon(data);
  const displayAddress = useAccountItemAddress(data);

  const copy = useCopy();
  const onClickDelete = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (data.id) {
        remove(data.id);
      }
    },
    [remove, data]
  );

  const onCopy = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      copy(displayAddress);
    },
    [copy, displayAddress]
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
                'border border-[#FFFFFF4D] group-hover:border-white border-solid',
                'w-[16px] h-[16px] rounded-full'
              )}
            />
          )}
        </div>
        <div className="mr-[7px]">
          <img className="w-[22px] h-[22px]" src={addressTypeIcon} alt="" />
        </div>
        <div className={clsx('text-white text-[12px]', 'flex-1 space-y-[6px]')}>
          <NicknameInput data={data} canEdit={canEdit} />
          <div className="flex space-x-[5px] items-center h-[14px]">
            <span className="opacity-50">{ellipsis(displayAddress)}</span>
            <div
              onClick={onCopy}
              className={clsx(
                'group-hover:block hidden',
                'opacity-60 hover:opacity-100'
              )}
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
            'flex items-end flex-col space-y-[6px]'
          )}
        >
          <div
            className={clsx(
              'font-medium text-[12px] leading-[19px]',
              'opacity-70',
              {
                hidden: data.balance === undefined,
              }
            )}
          >
            ${splitNumberByStep(Number(data.balance)?.toFixed(2))}
          </div>
          {isBundle && (
            <div className="opacity-60">{percentMap[data.id!]}%</div>
          )}
        </div>
      </div>
    </div>
  );
};
