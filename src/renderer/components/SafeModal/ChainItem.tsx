import { Chain } from '@debank/common';
import classNames from 'classnames';
import React from 'react';

export interface Props {
  value?: boolean;
  chain: Chain;
  onChange?: (chain: Chain) => void;
  isSupported: boolean;
}

export const ChainItem: React.FC<Props> = ({
  value,
  chain,
  onChange,
  isSupported,
}) => {
  return (
    <div
      className={classNames(
        'flex justify-between text-white',
        !isSupported && 'opacity-50'
      )}
    >
      <div className="flex gap-[10px] items-center">
        <img className="w-[16px] h-[16px]" src={chain.logo} />
        <div>{chain.name}</div>
      </div>
      <div>
        {isSupported ? (
          <button type="button" onClick={() => onChange?.(chain)}>
            {value ? 'selected' : 'select'}
          </button>
        ) : (
          <div>Coming soon</div>
        )}
      </div>
    </div>
  );
};
