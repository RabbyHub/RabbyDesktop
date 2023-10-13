import { useAtom, useAtomValue } from 'jotai';
import React, { useEffect } from 'react';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { validate, Network } from 'bitcoin-address-validation';
import { bundleAccountsAtom, bundleAccountsNumAtom } from './shared';
import { ERROR } from './error';
import {
  MatcherFunc,
  useAccountToDisplay,
  useRefreshAccountsOnContactBookChanged,
} from '../rabbyx/useAccountToDisplay';
import { toastMaxAccount } from './util';
import { useAddressManagement } from '../rabbyx/useAddressManagement';
import { useCexAccount } from './useCex/useCexAccount';
import { forwardMessageTo } from '../useViewsMessage';

const { nanoid } = require('nanoid');

export const useBundleIsMax = () => useAtomValue(bundleAccountsNumAtom) >= 15;

export const useBundleAccount = () => {
  const [accounts, setAccounts] = useAtom(bundleAccountsAtom);
  const { accountsList: ethAccountList, getAllAccountsToDisplay } =
    useAccountToDisplay();
  const { removeAddress } = useAddressManagement();
  const bundleIsMax = useBundleIsMax();
  const inBundleList = React.useMemo(() => {
    return accounts
      .filter((acc) => acc.inBundle)
      .map((acc) => {
        if (acc.type === 'eth') {
          const nickname =
            ethAccountList.find(
              (ethAccount) => ethAccount.address === acc.data.address
            )?.alianName ?? acc.nickname;
          return {
            ...acc,
            data: {
              ...acc.data,
              alianName: nickname,
            },
            nickname,
          };
        }

        return acc;
      });
  }, [accounts, ethAccountList]);
  const { cexAccount, cexCreate, cexPreCheck, cexCheckIsExisted } =
    useCexAccount();

  const btcList = React.useMemo(() => {
    return accounts.filter((acc) => acc.type === 'btc') as BTCAccount[];
  }, [accounts]);

  const ethList = React.useMemo(() => {
    return ethAccountList.map((acc) => {
      return {
        id: `${acc.type}.${acc.address}`,
        type: 'eth',
        nickname: acc.alianName,
        balance: acc.balance.toString(),
        data: acc,
        inBundle: accounts.some((account) => {
          return (
            account.type === 'eth' &&
            account.data.address === acc.address &&
            account.inBundle
          );
        }),
      } as ETHAccount;
    });
  }, [accounts, ethAccountList]);

  // 余额占比
  const percentMap = React.useMemo(() => {
    const list = inBundleList.map((item) => {
      return {
        id: item.id!,
        balance: Number(item.balance ?? '0'),
      };
    });
    const total = list.reduce((acc, item) => acc + item.balance, 0);
    return list.reduce((acc, item) => {
      const b = item.balance;
      let num = (b / total) * 100;
      if (Number.isNaN(num)) {
        num = 0;
      }
      acc[item.id] = num.toFixed(0);
      return acc;
    }, {} as Record<string, string>);
  }, [inBundleList]);

  const preCheck = React.useCallback(
    async (account: Partial<BundleAccount>) => {
      await cexPreCheck(account);

      if (account.type === 'btc') {
        if (!account.address) {
          return {
            error: ERROR.INVALID_ADDRESS,
          };
        }
        if (!validate(account.address, Network.mainnet)) {
          return {
            error: ERROR.INVALID_ADDRESS,
          };
        }
      } else if (account.type === 'eth') {
        if (!account.data?.address) {
          return {
            error: ERROR.INVALID_ADDRESS,
          };
        }
      }

      const result = accounts.find((acc) => {
        if (cexCheckIsExisted(acc, account)) {
          return true;
        }
        if (acc.type === 'btc' && account.type === 'btc') {
          if (acc.address === account.address) {
            return true;
          }
        } else if (acc.type === 'eth' && account.type === 'eth') {
          if (acc.data.address === account.data?.address) {
            return true;
          }
        }
        return false;
      });

      if (result) {
        return {
          error: ERROR.EXISTED,
        };
      }

      return {
        error: null,
      };
    },
    [accounts, cexPreCheck, cexCheckIsExisted]
  );

  const create = React.useCallback(
    async (account: Partial<BundleAccount>) => {
      if ((await preCheck(account)).error) {
        return;
      }
      let nickname = account.nickname || '';

      if (!nickname) {
        let num = 1;
        const cexResult = cexCreate({
          account,
          nickname,
          num,
        });
        nickname = cexResult.nickname;
        num = cexResult.num;
        if (account.type === 'btc') {
          nickname = 'BTC';
          num = btcList.length + 1;
        }
        nickname += ` ${num}`;
      }
      const newAccount: BundleAccount = {
        id: nanoid(),
        ...(account as BundleAccount),
        nickname,
      };
      window.rabbyDesktop.ipcRenderer.invoke('bundle-account-post', newAccount);

      return newAccount;
    },
    [btcList.length, cexCreate, preCheck]
  );

  const remove = React.useCallback(
    (id: string, showToast = true) => {
      const ethAccount = ethList.find((acc) => acc.id === id);

      if (ethAccount?.type === 'eth') {
        removeAddress([
          ethAccount.data.address,
          ethAccount.data.type,
          ethAccount.data.brandName,
        ]);
      }
      window.rabbyDesktop.ipcRenderer.invoke('bundle-account-delete', id);

      const account = accounts.find((acc) => acc.id === id) || ethAccount;
      if (!account) return;

      if (showToast) {
        // toastMessage({
        //   type: 'success',
        //   content: `${ellipsis(address)} deleted`,
        // });
      }
    },
    [accounts, ethList, removeAddress]
  );

  const toggleBundle = React.useCallback(
    async (account: BundleAccount) => {
      if (bundleIsMax && !account.inBundle) {
        toastMaxAccount();
        return;
      }
      const existed = accounts.find((acc) => acc.id === account.id);

      if (existed) {
        // eth 删除后不需要持久化存储在 bundle 列表里，这两个列表目前没做同步
        if (existed.type === 'eth' && account.inBundle && existed.id) {
          window.rabbyDesktop.ipcRenderer.invoke(
            'bundle-account-delete',
            existed.id
          );
          return;
        }
        window.rabbyDesktop.ipcRenderer.invoke('bundle-account-put', {
          ...account,
          inBundle: !account.inBundle,
        });
        return;
      }

      window.rabbyDesktop.ipcRenderer.invoke('bundle-account-post', {
        ...account,
        balance: account.type === 'eth' ? account.data.balance.toString() : '0',
        inBundle: true,
      });
    },
    [accounts, bundleIsMax]
  );

  const allAccounts = React.useMemo(
    () => [...accounts, ...ethList],
    [accounts, ethList]
  );

  const updateNickname = React.useCallback(
    async (id: BundleAccount['id'], nickname: BundleAccount['nickname']) => {
      const account = allAccounts.find((acc) => acc.id === id);
      if (!account) {
        return;
      }

      if (account.type === 'eth') {
        await walletController.updateAlianName(account.data.address, nickname);
        account.data.alianName = nickname;
        forwardMessageTo('*', 'refreshCurrentAccount', {});
      }

      window.rabbyDesktop.ipcRenderer.invoke('bundle-account-put', {
        ...account,
        nickname,
      });
    },
    [allAccounts]
  );

  const preCheckMaxAccount = React.useCallback(() => {
    if (bundleIsMax) {
      toastMaxAccount();
      return false;
    }
    return true;
  }, [bundleIsMax]);

  // 初始化数据
  // 获取 bundle 账户和 eth 账户
  React.useEffect(() => {
    window.rabbyDesktop.ipcRenderer.invoke('bundle-account-init');
    getAllAccountsToDisplay();

    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:bundle:changed',
      (data) => {
        setAccounts(data.accounts ?? []);
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setAccounts]);

  useRefreshAccountsOnContactBookChanged(
    React.useCallback(
      ({ partials }) =>
        !!ethAccountList.find((account) =>
          // eslint-disable-next-line no-prototype-builtins
          partials.hasOwnProperty(account.address)
        ),
      [ethAccountList]
    ) as MatcherFunc,
    getAllAccountsToDisplay
  );

  // eth 地址列表更新时同步 bundle 地址列表
  React.useEffect(() => {
    if (!ethAccountList.length) return;
    accounts.forEach((account) => {
      if (account.type === 'eth' && account.id) {
        if (
          !ethAccountList.find(
            (acc) =>
              acc.address === account.data.address &&
              acc.type === account.data.type &&
              acc.brandName === account.data.brandName
          )
        ) {
          remove(account.id, false);
        }
      }
    });
  }, [ethAccountList, accounts, remove]);

  return {
    create,
    remove,
    updateNickname,
    preCheck,
    inBundleList,
    btcList,
    ethList,
    toggleBundle,
    preCheckMaxAccount,
    percentMap,
    ...cexAccount,
  };
};
