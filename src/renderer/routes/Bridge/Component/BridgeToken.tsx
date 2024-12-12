import { CHAINS_ENUM } from '@debank/common';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { Input, InputRef } from 'antd';
import clsx from 'clsx';
import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import BigNumber from 'bignumber.js';
import SkeletonInput from 'antd/lib/skeleton/Input';
import styled from 'styled-components';
import RcIconInfoCC from '@/../assets/icons/common/info-cc.svg?rc';
import { useBridgeSupportChains } from '@/renderer/hooks/rabbyx/useBridge';
import { findChainByEnum } from '@/renderer/utils';
import { formatTokenAmount, formatUsdValue } from '@/renderer/utils/number';
import { MaxButton } from '@/renderer/components/MaxButton';
import { useSetSettingVisible } from '../hooks';
import { tokenAmountBn } from '../../Swap/utils';
import { ChainSelect } from '../../Swap/component/ChainSelect';
import { BridgeChainRender } from './BridgeChainRender';
import { BridgeTokenSelect } from './BridgeTokenSelect';

const StyledInput = styled(Input)`
  color: var(--r-neutral-title1, #192945);
  font-size: 24px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
  background: transparent !important;
  padding-left: 0;
  border: none;
  box-shadow: none;
  &:hover,
  &:focus {
    border: none;
    box-shadow: none;
  }
  & > .ant-input {
    color: var(--r-neutral-title1, #192945);
    font-size: 24px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    border-width: 0px !important;
    border-color: transparent;
    border: none;
    box-shadow: none;
  }

  &::placeholder {
    color: var(--r-neutral-foot, #6a7587);
  }

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

export const BridgeToken = ({
  type = 'from',
  token,
  chain,
  // excludeTokens,
  excludeChains,
  onChangeToken,
  onChangeChain,
  value,
  onInputChange,
  valueLoading,
  fromChainId,
  fromTokenId,
  noQuote,
}: {
  type?: 'from' | 'to';
  token?: TokenItem;
  chain?: CHAINS_ENUM;
  excludeChains?: CHAINS_ENUM[];
  onChangeToken: (token: TokenItem) => void;
  onChangeChain: (chain: CHAINS_ENUM) => void;
  value?: string | number;
  onInputChange?: (v: string) => void;

  valueLoading?: boolean;
  fromChainId?: string;
  fromTokenId?: string;
  noQuote?: boolean;
}) => {
  const { t } = useTranslation();

  const supportedChains = useBridgeSupportChains();

  const isFromToken = type === 'from';
  const isToToken = type === 'to';

  const name = isFromToken ? t('page.bridge.From') : t('page.bridge.To');
  const chainObj = findChainByEnum(chain);

  const openFeePopup = useSetSettingVisible();

  const isMaxRef = useRef(false);

  const inputRef = useRef<InputRef>();

  useLayoutEffect(() => {
    if (isFromToken) {
      if (
        document?.activeElement !== inputRef.current?.input &&
        !isMaxRef.current
      ) {
        inputRef.current?.focus();
      }
      isMaxRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const showNoQuote = useMemo(
    () => isToToken && !!noQuote,
    [isToToken, noQuote]
  );

  const useValue = useMemo(() => {
    if (token && value) {
      return formatUsdValue(
        new BigNumber(value).multipliedBy(token.price || 0).toString()
      );
    }
    return '$0.00';
  }, [token, value]);

  const inputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onInputChange?.(e.target.value);
    },
    [onInputChange]
  );

  const handleMax = React.useCallback(() => {
    if (token) {
      isMaxRef.current = true;
      onInputChange?.(tokenAmountBn(token)?.toString(10));
    }
  }, [token, onInputChange]);

  return (
    <div
      style={{
        background: 'rgba(0, 0, 0, 0.20)',
      }}
      className={clsx(
        'h-[156px] rounded-[8px]',
        'border-[0.5px] border-solid border-rabby-neutral-line'
      )}
    >
      <div
        className={clsx(
          'flex items-center gap-8',
          'px-16 py-12',
          'border-x-0 border-t-0 border-b-[0.5px] border-solid  border-rabby-neutral-line'
        )}
      >
        <span className="text-12 text-r-neutral-body">{name}</span>
        <ChainSelect
          value={chain!}
          onChange={onChangeChain}
          disabledTips="Not supported"
          title="Select chain"
          supportChains={supportedChains}
          chainRender={<BridgeChainRender chain={chain} />}
          excludeChains={excludeChains}
          hideTestnetTab
        />
      </div>

      <div className={clsx('p-16 pb-[18px]')}>
        <div className={clsx('flex justify-between items-center')}>
          {valueLoading ? (
            <SkeletonInput
              active
              className="rounded-[4px]"
              style={{
                width: 132,
                height: 28,
              }}
            />
          ) : (
            <StyledInput
              placeholder={showNoQuote ? t('page.bridge.no-quote') : '0'}
              value={value}
              onChange={inputChange}
              readOnly={!isFromToken}
              ref={inputRef as any}
            />
          )}

          <BridgeTokenSelect
            type={type}
            token={token}
            onChangeToken={onChangeToken}
            chainServerId={chainObj?.serverId}
            {...(type === 'to'
              ? {
                  fromChainId,
                  fromTokenId,
                }
              : {})}
          />
        </div>

        <div
          className={clsx(
            'flex justify-between items-center',
            'mt-14 text-13 text-r-neutral-foot'
          )}
        >
          <div className="flex items-center gap-2">
            {valueLoading ? (
              <SkeletonInput
                active
                className="rounded-[4px]"
                style={{
                  width: 36,
                  height: 16,
                }}
              />
            ) : (
              <span>{useValue}</span>
            )}
            {!valueLoading && isToToken && !!value && (
              <RcIconInfoCC
                onClick={() => openFeePopup(true)}
                viewBox="0 0 14 14"
                className="w-14 h-14 text-r-neutral-foot cursor-pointer"
              />
            )}
          </div>
          <div className="flex items-center gap-4">
            <span>
              {t('page.bridge.Balance')}

              {token
                ? formatTokenAmount(tokenAmountBn(token).toString(10)) || '0'
                : 0}
            </span>
            {isFromToken && (
              <MaxButton onClick={handleMax}>{t('page.swap.max')}</MaxButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
