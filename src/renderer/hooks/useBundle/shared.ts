import { atom } from 'jotai';

export const bundleAccountsAtom = atom<BundleAccount[]>([]);
export const bundleAccountsNumAtom = atom(
  (get) => get(bundleAccountsAtom).filter((acc) => acc.inBundle).length
);

export const saveBundleAccountsBalance = (
  bundleAccounts: Pick<BundleAccount, 'id' | 'balance'>[]
) => {
  window.rabbyDesktop.ipcRenderer.invoke(
    'bundle-account-update-balance',
    bundleAccounts
  );
};
