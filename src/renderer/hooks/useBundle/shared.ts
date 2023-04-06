import { atom } from 'jotai';

export const bundleAccountsAtom = atom<BundleAccount[]>([]);

export const saveBundleAccountsBalance = (
  bundleAccounts: Pick<BundleAccount, 'id' | 'balance'>[]
) => {
  window.rabbyDesktop.ipcRenderer.invoke(
    'bundle-account-update-balance',
    bundleAccounts
  );
};
