import { useEffect, useState } from 'react';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { ChainWithBalance } from '@rabby-wallet/rabby-api/dist/types';
import { atom, useAtom } from 'jotai';

import { CHAINS } from '@debank/common';

export interface DisplayChainWithWhiteLogo extends ChainWithBalance {
  logo?: string;
  whiteLogo?: string;
}

const formatChain = (item: ChainWithBalance): DisplayChainWithWhiteLogo => {
  const chainsArray = Object.values(CHAINS);
  const chain = chainsArray.find((i) => i.id === item.community_id);

  return {
    ...item,
    logo: chain?.logo || item.logo_url,
    whiteLogo: chain?.whiteLogo,
  };
};

const balanceAtom = atom<string | null>(null);

export function useBalanceValue() {
  return useAtom(balanceAtom);
}

export default function useCurrentBalance(
  account: string | undefined,
  update = false,
  noNeedBalance = false,
  nonce = 0
) {
  const wallet = walletController;
  const [balance, setBalance] = useBalanceValue();
  const [success, setSuccess] = useState(true);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceFromCache, setBalanceFromCache] = useState(false);
  let isCanceled = false;
  const [chainBalances, setChainBalances] = useState<
    DisplayChainWithWhiteLogo[]
  >([]);

  const getAddressBalance = async (address: string) => {
    try {
      const { total_usd_value: totalUsdValue, chain_list: chainList } =
        await wallet.getAddressBalance(address);
      if (isCanceled) return;
      setBalance(totalUsdValue.toString());
      setSuccess(true);
      setChainBalances(
        chainList.filter((i) => i.usd_value > 0).map(formatChain)
      );
      setBalanceLoading(false);
      setBalanceFromCache(false);
    } catch (e) {
      setSuccess(false);
      setBalanceLoading(false);
    }
  };

  const getCurrentBalance = async () => {
    if (!account || noNeedBalance) return;
    setBalanceLoading(true);
    const cacheData = await wallet.getAddressCacheBalance(account);
    if (cacheData) {
      setBalanceFromCache(true);
      setBalance(cacheData.total_usd_value.toString());
      if (update) {
        setBalanceLoading(true);
        getAddressBalance(account.toLowerCase());
      } else {
        setBalanceLoading(false);
      }
    } else {
      getAddressBalance(account.toLowerCase());
      setBalanceLoading(false);
      setBalanceFromCache(false);
    }
  };

  useEffect(() => {
    getCurrentBalance();
    if (!noNeedBalance && account) {
      wallet.getAddressCacheBalance(account).then((cache) => {
        setChainBalances(
          cache
            ? cache.chain_list
                .filter((item) => item.usd_value > 0)
                .map(formatChain)
            : []
        );
      });
    }
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      isCanceled = true;
    };
  }, [account, nonce]);
  return [
    balance,
    chainBalances,
    getAddressBalance,
    success,
    balanceLoading,
    balanceFromCache,
  ] as const;
}
