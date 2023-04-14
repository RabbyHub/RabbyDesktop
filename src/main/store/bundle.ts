/**
 * 存储 bundle 页面的数据
 * 地址管理
 *  - 支持 btc 和 bn 未来可能有其他地址类型
 *  - 修改备注
 *  - 新增和删除
 * bundle 地址管理
 *  - 添加到 bundle 列表
 *  - 查询链余额和资产分布
 *  - 查询 token 余额
 */

import { PERSIS_STORE_PREFIX } from '@/isomorphic/constants';
import { shortStringify, safeParse } from '@/isomorphic/json';
import { nanoid } from 'nanoid';
import { makeStore } from '../utils/store';
import { emitIpcMainEvent, handleIpcMainInvoke } from '../utils/ipcMainEvents';

// @ts-expect-error

export interface StoreProps {
  accounts: BundleAccount[];
}

const IBundleAccountSchema: import('json-schema-typed').JSONSchema = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: ['bn', 'btc', 'eth'],
    },
    nickname: {
      type: 'string',
    },
    inBundle: {
      type: 'boolean',
    },
    apiKey: {
      type: 'string',
    },
    apiSecret: {
      type: 'string',
    },
    address: {
      type: 'string',
    },
  },
};

// --------- STORE -----------
export const bundleStore = makeStore<StoreProps>({
  name: `${PERSIS_STORE_PREFIX}bundle`,

  schema: {
    accounts: {
      type: 'array',
      items: IBundleAccountSchema,
      default: [] as BundleAccount[],
    },
  },

  serialize: shortStringify,

  deserialize: (data) => safeParse(data, {}),

  watch: true,
});

// --------- API -----------
handleIpcMainInvoke('bundle-account-post', (_, account: BundleAccount) => {
  const accounts = bundleStore.get('accounts');

  account.id = account.id || nanoid();

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
      if (acc.data.address === account.data.address) {
        return true;
      }
    }
    return false;
  });

  if (result) {
    return {
      error: 'EXISTED',
    };
  }

  account.balance = account.balance || '0';

  accounts.push(account);
  bundleStore.set('accounts', accounts);

  emitIpcMainEvent('__internal_main:bundle:changed', {
    accounts,
  });

  return {};
});

handleIpcMainInvoke('bundle-account-put', (_, account: BundleAccount) => {
  const accounts = bundleStore.get('accounts').map((item) => {
    if (item.id === account.id) {
      return account;
    }
    return item;
  });

  bundleStore.set('accounts', accounts);

  emitIpcMainEvent('__internal_main:bundle:changed', {
    accounts,
  });
});

handleIpcMainInvoke('bundle-account-delete', (_, id: string) => {
  const accounts = bundleStore.get('accounts').filter((item) => item.id !== id);

  bundleStore.set('accounts', accounts);

  emitIpcMainEvent('__internal_main:bundle:changed', {
    accounts,
  });
});

handleIpcMainInvoke('bundle-account-init', () => {
  const accounts = bundleStore.get('accounts');

  emitIpcMainEvent('__internal_main:bundle:changed', {
    accounts,
  });
});

handleIpcMainInvoke(
  'bundle-account-update-balance',
  (_, bundleAccounts: Pick<BundleAccount, 'id' | 'balance'>[]) => {
    const accounts = bundleStore.get('accounts');

    const newAccounts = accounts.map((account) => {
      const bundleAccount = bundleAccounts.find(
        (item) => item.id === account.id
      );

      if (bundleAccount) {
        return {
          ...account,
          balance: bundleAccount.balance,
        };
      }

      return account;
    });

    bundleStore.set('accounts', newAccounts);
    emitIpcMainEvent('__internal_main:bundle:changed', {
      accounts: newAccounts,
    });
  }
);
