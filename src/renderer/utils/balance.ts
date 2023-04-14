import { TokenItem } from '@debank/rabby-api/dist/types';
import { useMemo } from 'react';
import BigNumber from 'bignumber.js';
import { DisplayProtocol } from '../hooks/useHistoryProtocol';

export const calcAssetNetWorth = (
  tokenList: TokenItem[],
  protocolList: DisplayProtocol[],
  chain: string | null = null
) => {
  let tokens = tokenList;
  let protocols = protocolList;
  if (chain) {
    tokens = tokens.filter((token) => token.chain === chain);
    protocols = protocols.filter((protocol) => protocol.chain === chain);
  }
  let sum = new BigNumber(0);

  tokens.forEach((token) => {
    sum = sum.plus(
      token.usd_value ?? new BigNumber(token.amount).times(token.price)
    );
  });

  protocols.forEach((protocol) => {
    protocol.portfolio_item_list.forEach((pool) => {
      sum = sum.plus(pool.stats.net_usd_value);
    });
  });

  return sum.toFixed();
};

export const useTotalBalance = (
  tokenList: TokenItem[],
  protocolList: DisplayProtocol[],
  chain: string | null = null
) => {
  const calc = useMemo(() => {
    return calcAssetNetWorth(tokenList, protocolList, chain);
  }, [chain, protocolList, tokenList]);

  return calc;
};
