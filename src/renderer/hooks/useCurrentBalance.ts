import { useEffect, useState } from 'react';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { atom, useAtom } from 'jotai';
import { DisplayChainWithWhiteLogo, formatChain } from '../utils/chain';

const balanceAtom = atom<string | null>(null);
const testnetBalanceAtom = atom<string | null>(null);

export default function useCurrentBalance(
  account: string | undefined,
  update = false,
  noNeedBalance = false,
  nonce = 0,
  includeTestnet = false
) {
  const wallet = walletController;
  const [balance, setBalance] = useAtom(balanceAtom);
  const [success, setSuccess] = useState(true);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceFromCache, setBalanceFromCache] = useState(false);
  let isCanceled = false;
  const [chainBalances, setChainBalances] = useState<
    DisplayChainWithWhiteLogo[]
  >([]);
  const [testnetBalance, setTestnetBalance] = useAtom(testnetBalanceAtom);
  const [testnetSuccess, setTestnetSuccess] = useState(true);
  const [testnetBalanceLoading, setTestnetBalanceLoading] = useState(false);
  const [testnetBalanceFromCache, setTestnetBalanceFromCache] = useState(false);
  const [testnetChainBalances, setTestnetChainBalances] = useState<
    DisplayChainWithWhiteLogo[]
  >([]);

  const getAddressBalance = async (address: string, force: boolean) => {
    try {
      const { total_usd_value: totalUsdValue, chain_list: chainList } =
        await wallet.getAddressBalance(address, force);
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

  const getTestnetBalance = async (address: string, force: boolean) => {
    try {
      const { total_usd_value: totalUsdValue, chain_list: chainList } =
        await wallet.getAddressBalance(address, force);
      if (isCanceled) return;
      setTestnetBalance(totalUsdValue.toString());
      setTestnetSuccess(true);
      setTestnetChainBalances(
        chainList.filter((i) => i.usd_value > 0).map(formatChain)
      );
      setTestnetBalanceLoading(false);
      setTestnetBalanceFromCache(false);
    } catch (e) {
      setTestnetSuccess(false);
      setTestnetBalanceLoading(false);
    }
  };

  const getCurrentBalance = async (force = false) => {
    if (!account || noNeedBalance) return;
    setBalanceLoading(true);
    const cacheData = await wallet.getAddressCacheBalance(account);
    if (cacheData) {
      setBalanceFromCache(true);
      setBalance(cacheData.total_usd_value.toString());
      if (update) {
        setBalanceLoading(true);
        getAddressBalance(account.toLowerCase(), force);
        if (includeTestnet) {
          getTestnetBalance(account.toLowerCase(), force);
        }
      } else {
        setBalanceLoading(false);
      }
    } else {
      getAddressBalance(account.toLowerCase(), force);
      if (includeTestnet) {
        getTestnetBalance(account.toLowerCase(), force);
      }
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
  return {
    balance,
    chainBalances,
    getAddressBalance,
    success,
    balanceLoading,
    balanceFromCache,
    testnetBalance,
    testnetSuccess,
    testnetBalanceLoading,
    testnetBalanceFromCache,
    testnetChainBalances,
  };
}
