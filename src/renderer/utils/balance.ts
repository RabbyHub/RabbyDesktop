import { TokenItem } from '@debank/rabby-api/dist/types';
import { useCallback } from 'react';
import BigNumber from 'bignumber.js';
import { DisplayProtocol } from '../hooks/useHistoryProtocol';

export const useTotalBalance = (
  tokenList: TokenItem[],
  protocolList: DisplayProtocol[],
  chain: string | null = null
) => {
  const calc = useCallback(() => {
    let tokens = tokenList;
    let protocols = protocolList;
    if (chain) {
      tokens = tokens.filter((token) => token.chain === chain);
      protocols = protocols.filter((protocol) => protocol.chain === chain);
    }
    let sum = new BigNumber(0);

    tokens.forEach((token) => {
      const usd = new BigNumber(token.amount).times(token.price);
      sum = sum.plus(usd);
    });
    protocols.forEach((protocol) => {
      protocol.portfolio_item_list.forEach((pool) => {
        sum = sum.plus(pool.stats.net_usd_value);
      });
    });
    return sum.toFixed();
  }, [chain, protocolList, tokenList]);

  return calc();
};
