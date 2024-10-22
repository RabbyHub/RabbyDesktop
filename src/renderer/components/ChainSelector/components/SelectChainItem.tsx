/* eslint-disable react-hooks/exhaustive-deps */
import React, { useMemo, forwardRef, HTMLAttributes, useEffect } from 'react';
import { CHAINS_ENUM, Chain } from '@debank/common';
import { Tooltip } from 'antd';
import clsx from 'clsx';
import { formatUsdValue } from '@/renderer/utils/number';
import { useCustomRPC } from '@/renderer/hooks/useCustomRPC';
import IconCheck from '../icons/check-2.svg?rc';
import RcIconPinned from '../icons/icon-pinned.svg?rc';
import RcIconPinnedFill from '../icons/icon-pinned-fill.svg?rc';
import RcIconChainBalance from '../icons/chain-balance.svg?rc';
import ChainIcon from '../../ChainIcon';
import { TestnetChainLogo } from '../../TestnetChainLogo';

export type SelectChainItemProps = {
  stared?: boolean;
  data: Chain;
  value?: CHAINS_ENUM;
  onStarChange?: (value: boolean) => void;
  onChange?: (value: CHAINS_ENUM) => void;
  disabled?: boolean;
  usdValue?: number;
  disabledTips?: string | ((ctx: { chain: Chain }) => string);
  showRPCStatus?: boolean;
} & Omit<HTMLAttributes<HTMLDivElement>, 'onChange'>;

export const SelectChainItem = forwardRef(
  (
    {
      data,
      className,
      stared,
      value,
      onStarChange,
      onChange,
      disabled = false,
      disabledTips = 'Coming soon',
      showRPCStatus = false,
      usdValue,
      ...rest
    }: SelectChainItemProps,
    ref: React.ForwardedRef<HTMLDivElement>
  ) => {
    const { data: customRPC, getAllRPC } = useCustomRPC();
    useEffect(() => {
      if (customRPC) {
        return;
      }
      getAllRPC();
    }, [getAllRPC, customRPC]);

    const finalDisabledTips = useMemo(() => {
      if (typeof disabledTips === 'function') {
        return disabledTips({ chain: data });
      }

      return disabledTips;
    }, [disabledTips]);

    const PinnedIcon = stared ? RcIconPinnedFill : RcIconPinned;

    return (
      <Tooltip
        trigger={['click', 'hover']}
        mouseEnterDelay={3}
        overlayClassName={clsx('rectangle')}
        placement="top"
        title={finalDisabledTips}
        visible={disabled ? undefined : false}
        align={{ targetOffset: [0, -30] }}
      >
        <div
          className={clsx(
            'select-chain-item',
            disabled && 'opacity-50 select-chain-item-disabled cursor-default',
            className
          )}
          ref={ref}
          {...rest}
          onClick={() => !disabled && onChange?.(data.enum)}
        >
          <div className="flex items-center flex-1">
            {data.isTestnet ? (
              <TestnetChainLogo
                name={data.name}
                className="select-chain-item-icon"
              />
            ) : (
              <>
                {showRPCStatus ? (
                  <ChainIcon
                    chain={data.enum}
                    customRPC={
                      customRPC[data.enum]?.enable
                        ? customRPC[data.enum].url
                        : ''
                    }
                    showCustomRPCToolTip
                  />
                ) : (
                  <img
                    src={data.logo}
                    alt=""
                    className="select-chain-item-icon"
                  />
                )}
              </>
            )}
            <div className="select-chain-item-info">
              <div className="select-chain-item-name">{data.name}</div>
              {!!usdValue && (
                <div className="select-chain-item-balance">
                  <RcIconChainBalance className="w-[14px] h-[14px] mt-2" />
                  <div className="ml-[6px] relative top-[2px]">
                    {formatUsdValue(usdValue || 0)}
                  </div>
                </div>
              )}
            </div>
          </div>
          <PinnedIcon
            className={clsx(
              'select-chain-item-star w-16 h-16',
              stared ? 'is-active' : ''
            )}
            onClick={(e) => {
              e.stopPropagation();
              onStarChange?.(!stared);
            }}
          />
          {value === data.enum ? (
            <IconCheck className="select-chain-item-checked" />
          ) : null}
        </div>
      </Tooltip>
    );
  }
);
