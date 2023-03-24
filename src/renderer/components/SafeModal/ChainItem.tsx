import { Chain } from '@debank/common';
import classNames from 'classnames';
import React from 'react';

export interface Props {
  value?: boolean;
  chain: Chain;
  onChange?: (chain: Chain) => void;
  isSupported: boolean;
}

const IconChecked = 'rabby-internal://assets/icons/queue/address-checked.svg';
const IconUnCheck = 'rabby-internal://assets/icons/queue/address-uncheck.svg';

export const ChainItem: React.FC<Props> = ({
  value,
  chain,
  onChange,
  isSupported,
}) => {
  return (
    <div
      className={classNames(
        'flex justify-between items-center text-white',
        'py-[14px] px-[24px] rounded-[8px]',
        'border border-solid border-transparent',
        isSupported
          ? 'cursor-pointer hover:bg-color-[#FFFFFF1A] hover:border-[#FFFFFF1A]'
          : 'cursor-not-allowed opacity-40'
      )}
      onClick={() => {
        if (isSupported) {
          onChange?.(chain);
        }
      }}
    >
      <div className="flex gap-[8px] items-center">
        <img className="w-[28px] h-[28px]" src={chain.logo} />
        <div className="text-[15px]">{chain.name}</div>
      </div>
      <div>
        {isSupported ? (
          <img src={value ? IconChecked : IconUnCheck} alt="" />
        ) : (
          <div>coming soon</div>
        )}
      </div>
    </div>
  );
};
