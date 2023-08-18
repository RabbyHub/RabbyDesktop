import { TotalBalanceResponse } from '@rabby-wallet/rabby-api/dist/types';
import { coerceFloat } from '../primitive';
import { formatChainToDisplay, type DisplayChainWithWhiteLogo } from './chain';

export type MatteredChainBalancesType = {
  [x: string]: DisplayChainWithWhiteLogo | undefined;
};

export function formatAccountTotalBalance(result: TotalBalanceResponse | null) {
  const totalUsdValue = (result?.chain_list || []).reduce(
    (accu, cur) => accu + coerceFloat(cur.usd_value),
    0
  );
  const matteredChainBalances = (result?.chain_list || []).reduce(
    (accu, cur) => {
      const curUsdValue = coerceFloat(cur.usd_value);
      // TODO: only leave chain with blance greater than $1 and has percentage 1%
      if (curUsdValue > 1 && curUsdValue / totalUsdValue > 0.01) {
        accu[cur.id] = formatChainToDisplay(cur);
      }
      return accu;
    },
    {} as MatteredChainBalancesType
  );

  return {
    totalUsdValue,
    matteredChainBalances,
  };
}
