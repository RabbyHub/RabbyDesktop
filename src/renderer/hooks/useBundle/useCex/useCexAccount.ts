import { useAtom } from 'jotai';
import React from 'react';
import { bundleAccountsAtom } from '../shared';
import { Binance } from '../cex/binance/binance';
import { OKX } from '../cex/okx/okx';
import { ERROR } from '../error';

export const useCexAccount = () => {
  const [accounts] = useAtom(bundleAccountsAtom);

  const binanceList = React.useMemo(() => {
    return accounts.filter((acc) => acc.type === 'bn') as BNAccount[];
  }, [accounts]);
  const okxList = React.useMemo(() => {
    return accounts.filter((acc) => acc.type === 'okx') as OkxAccount[];
  }, [accounts]);

  const cexCreate = React.useCallback(
    ({
      account,
      nickname,
      num,
    }: {
      account: Partial<BundleAccount>;
      nickname: string;
      num: number;
    }) => {
      if (account.type === 'bn') {
        nickname = 'Binance';
        num = binanceList.length + 1;
      } else if (account.type === 'okx') {
        nickname = 'OKX';
        num = okxList.length + 1;
      }

      return { nickname, num };
    },
    [binanceList.length, okxList.length]
  );

  const cexPreCheck = React.useCallback(
    async (account: Partial<BundleAccount>) => {
      if (account.type === 'bn') {
        if (!account.apiKey || !account.apiSecret) {
          return {
            error: ERROR.INVALID_KEY,
          };
        }

        const bn = new Binance({
          apiKey: account.apiKey,
          apiSecret: account.apiSecret,
          enableInvalidKeyModal: false,
        });
        try {
          await bn.checkPermission();
        } catch (error: any) {
          return {
            error: error.message,
          };
        }
      } else if (account.type === 'okx') {
        if (!account.apiKey || !account.apiSecret || !account.passphrase) {
          return {
            error: ERROR.INVALID_KEY,
          };
        }

        const okx = new OKX({
          apiKey: account.apiKey,
          apiSecret: account.apiSecret,
          passphrase: account.passphrase,
          simulated: account.simulated,
          enableInvalidKeyModal: false,
        });
        try {
          await okx.checkPermission();
        } catch (error: any) {
          return {
            error: error.message,
          };
        }
      }

      return undefined;
    },
    []
  );

  const cexCheckIsExisted = React.useCallback(
    (acc: Partial<BundleAccount>, account: Partial<BundleAccount>) => {
      if (acc.type === 'bn' && account.type === 'bn') {
        if (acc.apiKey === account.apiKey) {
          return true;
        }
      } else if (acc.type === 'okx' && account.type === 'okx') {
        if (acc.apiKey === account.apiKey) {
          return true;
        }
      }

      return false;
    },
    []
  );

  return {
    cexAccount: {
      binanceList,
      okxList,
    },
    cexCreate,
    cexPreCheck,
    cexCheckIsExisted,
  };
};
