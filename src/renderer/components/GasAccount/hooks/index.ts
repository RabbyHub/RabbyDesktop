import { useInfiniteScroll, useInViewport } from 'ahooks';
import { message } from 'antd';
import { atom, useAtom } from 'jotai';
import { uniqBy } from 'lodash';
import React, {
  useRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAsync } from 'react-use';
import { walletController, walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { useGasAccountRefreshId, useGasAccountSetRefreshId } from './context';
import { GasAccountInfo, GasAccountServiceStore } from '../type';

const gasAccountAtom = atom<null | GasAccountServiceStore>(null);
const refreshAtom = atom<number>(0);

export const useGasAccountRefresh = () => {
  const refreshId = useGasAccountRefreshId();
  const setRefreshId = useGasAccountSetRefreshId();

  const refresh = useCallback(() => setRefreshId((e) => e + 1), [setRefreshId]);

  return { refreshId, refresh };
};

export const useGasAccountSign = () => {
  const [gasAccount, setGasAccount] = useAtom(gasAccountAtom);
  const [refresh, setRefresh] = useAtom(refreshAtom);
  const refreshAccount = React.useCallback(() => {
    setRefresh((e) => e + 1);
  }, [setRefresh]);

  const fetchCurrentAccount = useCallback(async () => {
    const res = await walletController.getGasAccountData();
    if (res) {
      setGasAccount(res);
    }
  }, [setGasAccount]);

  useEffect(() => {
    fetchCurrentAccount();
  }, [fetchCurrentAccount, refresh]);

  return {
    sig: gasAccount?.sig,
    accountId: gasAccount?.accountId,
    account: gasAccount?.account,
    refreshAccount,
  };
};

export const useGasAccountInfo = () => {
  const { sig, accountId, account } = useGasAccountSign();

  const { refreshId } = useGasAccountRefresh();

  const { value, loading, error } = useAsync(async () => {
    if (!sig || !accountId) return undefined;
    const res = await walletOpenapi.getGasAccountInfo({ sig, id: accountId });
    if (res.account.id) {
      return res;
    }
    walletController.setGasAccountSig();
    return undefined;
  }, [sig, accountId, refreshId]);

  if (
    error?.message?.includes('gas account verified failed') &&
    sig &&
    accountId
  ) {
    walletController.setGasAccountSig();
  }

  return { loading, value, account };
};

export const useGasAccountMethods = () => {
  const { sig, accountId, refreshAccount } = useGasAccountSign();

  const login = useCallback(async () => {
    await walletController.signGasAccount();
    refreshAccount();
  }, [refreshAccount]);

  const logout = useCallback(async () => {
    if (sig && accountId) {
      const result = await walletOpenapi.logoutGasAccount({
        sig,
        account_id: accountId,
      });
      if (result.success) {
        walletController.setGasAccountSig();
        refreshAccount();
      } else {
        message.error('please retry');
      }
    }
  }, [accountId, refreshAccount, sig]);

  return { login, logout };
};

export const useGasAccountLogin = ({
  loading,
  value,
}: {
  loading: boolean;
  value: GasAccountInfo['value'];
}) => {
  const { sig, accountId } = useGasAccountSign();

  const { login, logout } = useGasAccountMethods();

  const isLogin = useMemo(
    () => (!loading ? !!value?.account?.id : !!sig && !!accountId),
    [sig, accountId, loading, value?.account?.id]
  );

  return { login, logout, isLogin };
};

export const useGasAccountHistory = () => {
  const { sig, accountId } = useGasAccountSign();

  // const wallet = useWallet();

  const [refreshTxListCount, setRefreshListTx] = useState(0);
  const refreshListTx = React.useCallback(() => {
    setRefreshListTx((e) => e + 1);
  }, []);

  const { refresh: refreshGasAccountBalance, refreshId } =
    useGasAccountRefresh();

  type History = Awaited<ReturnType<typeof walletOpenapi.getGasAccountHistory>>;

  const {
    data: txList,
    loading,
    loadMore,
    loadingMore,
    noMore,
    mutate,
  } = useInfiniteScroll<{
    rechargeList: History['recharge_list'];
    list: History['history_list'];
    totalCount: number;
  }>(
    async (d) => {
      const data = await walletOpenapi.getGasAccountHistory({
        sig: sig || '',
        account_id: accountId || '',
        start: d?.list?.length && d?.list?.length > 1 ? d?.list?.length : 0,
        limit: 5,
      });

      const rechargeList = data.recharge_list;
      const historyList = data.history_list;

      return {
        rechargeList: rechargeList || [],
        list: historyList,
        totalCount: data.pagination.total,
      };
    },

    {
      reloadDeps: [sig],
      isNoMore(data) {
        if (data) {
          return (
            data.totalCount <=
            (data.list.length || 0) + (data?.rechargeList?.length || 0)
          );
        }
        return true;
      },
      manual: !sig || !accountId,
    }
  );

  const { value } = useAsync(async () => {
    if (sig && accountId && (refreshTxListCount || refreshId)) {
      const res = await walletOpenapi.getGasAccountHistory({
        sig,
        account_id: accountId,
        start: 0,
        limit: 5,
      });
      return res;
    }
    return undefined;
  }, [sig, refreshTxListCount, refreshId]);

  useEffect(() => {
    if (value?.history_list) {
      mutate((d) => {
        if (!d) {
          return;
        }

        if (value?.recharge_list?.length !== d.rechargeList.length) {
          refreshGasAccountBalance();
        }
        return {
          rechargeList: value?.recharge_list,
          totalCount: value.pagination.total,
          list: uniqBy(
            [...(value?.history_list || []), ...(d?.list || [])],
            (e) => `${e.chain_id}${e.tx_id}` as string
          ),
        };
      });
    }
  }, [mutate, refreshGasAccountBalance, value]);

  const ref = useRef<HTMLDivElement>(null);

  const [inViewport] = useInViewport(ref);

  useEffect(() => {
    if (!noMore && inViewport && !loadingMore && loadMore) {
      loadMore();
    }
  }, [inViewport, loadMore, loading, loadingMore, noMore]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!loading && !loadingMore && !!txList?.rechargeList?.length) {
      timer = setTimeout(refreshListTx, 2000);
    }
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [loading, loadingMore, refreshListTx, txList]);

  return {
    loading,
    txList,
    loadingMore,
    ref,
  };
};
