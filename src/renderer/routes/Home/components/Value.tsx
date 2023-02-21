import React, { ReactNode } from 'react';
import dayjs from 'dayjs';
import { TokenItem } from '@debank/rabby-api/dist/types';
import {
  formatUsdValue,
  formatTokenAmount,
  formatNumber,
} from '@/renderer/utils/number';
import { getTokens, ellipsisTokenSymbol, getUsd } from '@/renderer/utils/token';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import { Table } from './Table';

const Col = Table.Col;

const DebtTag = styled.div`
  border: 1px solid #ff6060;
  border-radius: 4px;
  padding: 2px 5px;
  font-weight: 700;
  font-size: 10px;
  line-height: 12px;
  text-transform: uppercase;
  color: #ff6060;
  margin-left: 6px;
`;

const TokenAmountWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 7px;
  &:nth-last-child(1) {
    margin-bottom: 0;
  }
`;

const TokensAmount = ({
  tokens,
  withPrice = false,
  isDebt = false,
}: {
  tokens: TokenItem[];
  withPrice?: boolean;
  isDebt?: boolean;
}) => {
  return (
    <div>
      {tokens
        .filter((item) => !!item)
        .map((item) => (
          <TokenAmountWrapper>
            {formatTokenAmount(item.amount)} {ellipsisTokenSymbol(item.symbol)}
            {isDebt ? <DebtTag>Debt</DebtTag> : null}
            {item.price !== 0 &&
              withPrice &&
              `(${formatUsdValue(
                new BigNumber(item.price).times(item.amount).toFixed()
              )})`}
          </TokenAmountWrapper>
        ))}
    </div>
  );
};

export const String = ({ value }: { value: ReactNode }) => {
  return <Col>{value}</Col>;
};

export const Time = ({ value }: { value: string | number | undefined }) => {
  return (
    <Col>
      {!value ? '-' : dayjs(Number(value) * 1000).format('YYYY/MM/DD HH:mm')}
    </Col>
  );
};

export const Balances = ({
  value,
  isDebt = false,
}: {
  value: TokenItem[];
  isDebt?: boolean;
}) => {
  value = Array.isArray(value) ? value : [value];
  return (
    <Col>{!value ? '' : <TokensAmount tokens={value} isDebt={isDebt} />}</Col>
  );
};

export const Balance = ({
  value,
  isDebt = false,
}: {
  value: TokenItem;
  isDebt?: boolean;
}) => {
  return (
    <Col>
      <TokensAmount tokens={[value]} isDebt={isDebt} />
    </Col>
  );
};

export const TokensSlash = ({ value }: { value: TokenItem[] }) => {
  value = Array.isArray(value) ? value : [value];
  return <Col>{getTokens(value, '/')}</Col>;
};

export const Tokens = ({ value }: { value: TokenItem[] }) => {
  value = Array.isArray(value) ? value : [value];
  return <Col>{getTokens(value)}</Col>;
};

export const Token = ({ value }: { value: TokenItem }) => {
  return <Tokens value={[value]} />;
};

export const USDValue = ({ value }: { value: string | number }) => {
  return <Col>{formatUsdValue(value)}</Col>;
};

export const TokensUSDValue = ({ value }: { value: TokenItem[] }) => {
  return <Col>{getUsd(value)}</Col>;
};

export const TokenUSDValue = ({ value }: { value: TokenItem }) => {
  return <TokensUSDValue value={[value]} />;
};

export const Bool = ({ value }: { value: number }) => {
  return <Col>{value ? 'Yes' : 'No'}</Col>;
};

export const Percent = ({ value }: { value?: number | string }) => {
  // if (value === undefined || Number.isNaN(+value)) return <Col />;
  return <Col>{formatNumber((value ? +value : 0) * 100)}%</Col>;
};

export const NumberWithCommas = ({ value }: { value: number | string }) => {
  return <Col>{formatNumber(value)}</Col>;
};

export const NumbersWithCommas = ({
  value,
}: {
  value: (number | string | undefined)[];
}) => {
  return <Col>{value.map((v) => (v ? formatNumber(v) : '-')).join(' / ')}</Col>;
};

export const ClaimableTokens = ({
  value,
  isDebt = false,
}: {
  value: TokenItem | TokenItem[];
  isDebt?: boolean;
}) => {
  return (
    <Col>
      <TokensAmount
        tokens={Array.isArray(value) ? value : [value]}
        withPrice
        isDebt={isDebt}
      />
    </Col>
  );
};

const DeviderWrapper = styled.div`
  background-color: rgba(255, 255, 255, 0.1);
  height: 1px;
  margin-bottom: 12px;
`;
export const Divider = () => {
  return <DeviderWrapper />;
};