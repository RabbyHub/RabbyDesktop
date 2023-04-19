import { useAtom, useAtomValue } from 'jotai';
import React from 'react';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { validate, Network } from 'bitcoin-address-validation';
import { toastMessage } from '@/renderer/components/TransparentToast';
import { ellipsis } from '@/renderer/utils/address';
import { Binance } from './cex/binance/binance';
import { bundleAccountsAtom, bundleAccountsNumAtom } from './shared';
import { ERROR } from './error';
import { useAccountToDisplay } from '../rabbyx/useAccountToDisplay';
import { toastMaxAccount } from './util';
import { useAddressManagement } from '../rabbyx/useAddressManagement';

const { nanoid } = require('nanoid');

export const useBundleIsMax = () => useAtomValue(bundleAccountsNumAtom) >= 15;

export const useBundleAccount = () => {
  const [accounts, setAccounts] = useAtom(bundleAccountsAtom);
  const { accountsList: ethAccountList, getAllAccountsToDisplay } =
    useAccountToDisplay();
  const { removeAddress } = useAddressManagement();
  const inBundleList = React.useMemo(() => {
    return accounts.filter((acc) => acc.inBundle);
  }, [accounts]);
  const binanceList = React.useMemo(() => {
    return accounts.filter((acc) => acc.type === 'bn') as BNAccount[];
  }, [accounts]);

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
      } else if (account.type === 'btc') {
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
        if (acc.type === 'bn' && account.type === 'bn') {
          if (acc.apiKey === account.apiKey) {
            return true;
          }
        } else if (acc.type === 'btc' && account.type === 'btc') {
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
    [accounts]
  );

  const create = React.useCallback(
    async (account: Partial<BundleAccount>) => {
      if ((await preCheck(account)).error) {
        return;
      }
      let nickname = account.nickname || '';

      if (!nickname) {
        let num = 1;
        if (account.type === 'bn') {
          nickname = 'Binance';
          num = binanceList.length + 1;
        } else if (account.type === 'btc') {
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
    [binanceList.length, btcList.length, preCheck]
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
      // toast 提示
      let address = '';
      switch (account.type) {
        case 'eth':
          address = account.data.address;
          break;
        case 'bn':
          address = account.apiKey;
          break;
        case 'btc':
          address = account.address;
          break;
        default:
          break;
      }

      if (showToast) {
        toastMessage({
          type: 'success',
          content: `${ellipsis(address)} deleted`,
        });
      }
    },
    [accounts, ethList, removeAddress]
  );

  const toggleBundle = React.useCallback(
    async (account: BundleAccount) => {
      if (accounts.length >= 15 && !account.inBundle) {
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
    [accounts]
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
      }

      window.rabbyDesktop.ipcRenderer.invoke('bundle-account-put', {
        ...account,
        nickname,
      });
    },
    [allAccounts]
  );

  const preCheckMaxAccount = React.useCallback(() => {
    if (accounts.length >= 15) {
      toastMaxAccount();
      return false;
    }
    return true;
  }, [accounts]);

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
    binanceList,
    btcList,
    ethList,
    toggleBundle,
    preCheckMaxAccount,
    percentMap,
  };
};
