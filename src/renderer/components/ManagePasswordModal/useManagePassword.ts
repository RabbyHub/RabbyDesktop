import { PasswordStatus } from '@/isomorphic/wallet/lock';
import { atom, useAtom } from 'jotai';
import { useCallback, useEffect, useState } from 'react';

type ManagePasswordViewType =
  | 'unknown'
  | 'manage-password'
  | 'setup-password'
  | 'password-setup'
  | 'change-password'
  | 'cancel-password';

const managePwdUIAtom = atom<{
  isShown: boolean;
  view: ManagePasswordViewType;
}>({
  isShown: false,
  // isShown: !IS_RUNTIME_PRODUCTION,
  view: 'unknown',
});

export function useManagePasswordUI() {
  const [{ isShown: isShowManagePassword, view: managePwdView }, setUIState] =
    useAtom(managePwdUIAtom);

  const setManagePwdView = useCallback(
    (view: ManagePasswordViewType) => {
      setUIState((state) => ({ ...state, view }));
    },
    [setUIState]
  );

  const setIsShowManagePassword = useCallback(
    (isShown: boolean) => {
      setUIState((state) => ({ ...state, isShown }));
    },
    [setUIState]
  );

  return {
    managePwdView,
    setManagePwdView,

    isShowManagePassword,
    setIsShowManagePassword,
  };
}

const lockInfoAtom = atom<RabbyDesktopLockInfo>({
  pwdStatus: PasswordStatus.Unknown,
});

export function useWalletLockInfo(options?: { autoFetch?: boolean }) {
  const [lockInfo, setLockInfo] = useAtom(lockInfoAtom);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLockInfo = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await window.rabbyDesktop.ipcRenderer.invoke(
        'get-wallet-lock-info'
      );

      setLockInfo({
        pwdStatus: response.pwdStatus,
      });

      return response;
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }

    return { pwdStatus: PasswordStatus.Unknown };
  }, [setLockInfo]);

  const setupPassword = useCallback(
    async (newPassword: string) => {
      const result = await window.rabbyDesktop.ipcRenderer.invoke(
        'setup-wallet-password',
        newPassword
      );
      fetchLockInfo();

      if (result.error) {
        throw new Error(result.error);
      }
    },
    [fetchLockInfo]
  );

  const updatePassword = useCallback(
    async (oldPassword: string, newPassword: string) => {
      const result = await window.rabbyDesktop.ipcRenderer.invoke(
        'update-wallet-password',
        oldPassword,
        newPassword
      );
      fetchLockInfo();

      if (result.error) {
        throw new Error(result.error);
      }
    },
    [fetchLockInfo]
  );

  const cancelPassword = useCallback(
    async (oldPassword: string) => {
      const result = await window.rabbyDesktop.ipcRenderer.invoke(
        'clear-wallet-password',
        oldPassword
      );
      fetchLockInfo();

      if (result.error) {
        throw new Error(result.error);
      }
    },
    [fetchLockInfo]
  );

  useEffect(() => {
    if (options?.autoFetch) {
      fetchLockInfo();
    }
  }, [options?.autoFetch, fetchLockInfo]);

  return {
    isLoading,
    lockInfo,
    fetchLockInfo,

    setupPassword,
    updatePassword,
    cancelPassword,
  };
}
