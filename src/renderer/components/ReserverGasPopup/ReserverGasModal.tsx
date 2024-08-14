import React, { useCallback, useState } from 'react';

import { CHAINS_ENUM } from '@debank/common';
import { GasLevel } from '@rabby-wallet/rabby-api/dist/types';
import { Button } from 'antd';
import BigNumber from 'bignumber.js';
import clsx from 'clsx';
import { findChain } from '@/renderer/utils/chain';
import { formatTokenAmount } from '@/renderer/utils/number';
import { Checkbox } from '../Checkbox';

import RcIconCheckedCC from './icons/icon-checked-cc.svg?rc';
import RcIconUnCheckedCC from './icons/icon-unchecked-cc.svg?rc';

import './index.module.less';

export type GasLevelType = keyof typeof SORT_SCORE;
export interface ReserveGasContentProps {
  chain: CHAINS_ENUM;
  gasList?: GasLevel[];
  limit: number;
  selectedItem?: GasLevelType | string;
  onGasChange: (gasLevel: GasLevel) => void;
  rawHexBalance?: string | number;
}

const SORT_SCORE = {
  fast: 1,
  normal: 2,
  slow: 3,
  custom: 4,
};

export type ReserveGasType = {
  getSelectedGasLevel: () => GasLevel | null;
};
export const ReserveGasContent = React.forwardRef<
  ReserveGasType,
  ReserveGasContentProps
>((props, ref) => {
  const {
    gasList,
    chain,
    limit = 1000000,
    selectedItem = 'normal',
    onGasChange,
    rawHexBalance,
  } = props;

  const [currentSelectedItem, setCurrentSelectedItem] = useState(selectedItem);
  const [gasLevel, setGasLevel] = useState<GasLevel>();

  React.useImperativeHandle(ref, () => ({
    getSelectedGasLevel: () => gasLevel ?? null,
  }));

  const nameMapping = React.useMemo(
    () => ({
      slow: 'Normal',
      normal: 'Fast',
      fast: 'Instant',
    }),
    []
  );

  const { decimals, symbol } = React.useMemo(
    () => ({
      decimals: findChain({ enum: chain })?.nativeTokenDecimals || 1e18,
      symbol: findChain({ enum: chain })?.nativeTokenSymbol || '',
    }),
    [chain]
  );

  const sortedList = React.useMemo(
    () =>
      gasList?.sort((a, b) => {
        const v1 = SORT_SCORE[a.level as GasLevelType];
        const v2 = SORT_SCORE[b.level as GasLevelType];
        return v1 - v2;
      }),
    [gasList]
  );

  const getAmount = React.useCallback(
    (price: number) =>
      formatTokenAmount(
        new BigNumber(limit)
          .times(price)
          .div(10 ** decimals)
          .toString(),
        6
      ),
    [limit, decimals]
  );

  const checkIsInsufficient = useCallback(
    (price: number) => {
      if (rawHexBalance === undefined || rawHexBalance === null) {
        return false;
      }
      return new BigNumber(rawHexBalance || 0, 16).lt(
        new BigNumber(limit).times(price)
      );
    },
    [rawHexBalance, limit]
  );

  return (
    <div>
      <div className={clsx('flex flex-col gap-12')}>
        {sortedList?.map((item) => {
          const checked = currentSelectedItem === item.level;

          const gasIsSufficient = checkIsInsufficient(item.price);

          const onChecked = () => {
            if (gasIsSufficient) {
              return;
            }
            setGasLevel(item);
            setCurrentSelectedItem(item.level as any);
          };

          if (checked && gasLevel?.level !== currentSelectedItem) {
            setGasLevel(item);
          }

          const isCustom = item.level === 'custom';

          return (
            <div
              key={item.level}
              className={clsx(
                'flex justify-between',
                'py-[22px] px-16 rounded-[8px] h-[60px]',
                'bg-r-neutral-card-1 border border-solid  ',
                checked ? 'border-rabby-blue-default' : 'border-transparent',
                gasIsSufficient
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:border-rabby-blue-default cursor-pointer'
              )}
              onClick={onChecked}
            >
              <div
                className={clsx(
                  'flex items-center gap-6',
                  'text-15 text-r-neutral-title1 font-medium'
                )}
              >
                <span>
                  {isCustom
                    ? `Don't reserve Gas`
                    : nameMapping[
                        item.level as Exclude<GasLevelType, 'custom'>
                      ]}
                </span>
                {!isCustom && (
                  <>
                    <span>·</span>
                    <span className="text-14 text-r-neutral-foot">
                      {new BigNumber(item.price / 1e9).toFixed().slice(0, 8)}{' '}
                      Gwei
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-16">
                {!isCustom && (
                  <span className="text-r-neutral-title-1 text-15 font-medium">
                    ≈ {getAmount(item.price)} {symbol}
                  </span>
                )}
                <Checkbox
                  checked={checked}
                  onChange={onChecked}
                  background="transparent"
                  unCheckBackground="transparent"
                  width="20px"
                  height="20px"
                  checkIcon={
                    checked ? (
                      <RcIconCheckedCC
                        viewBox="0 0 20 20"
                        className="text-r-blue-default w-full h-full"
                      />
                    ) : (
                      <RcIconUnCheckedCC
                        viewBox="0 0 20 20"
                        className="text-r-neutral-body w-full h-full"
                      />
                    )
                  }
                />
              </div>
            </div>
          );
        })}

        <div
          className={clsx(
            'absolute left-0 bottom-0',
            'w-full px-20 py-18 h-[80px]',
            'border-[0]',
            'border-t-[0.5px] border-solid border-rabby-neutral-line'
          )}
        >
          <Button
            type="primary"
            block
            className="h-[44px] rounded-[6px] text-15 text-r-neutral-title2"
            onClick={() => {
              if (gasLevel) {
                onGasChange(gasLevel);
              }
            }}
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
});
