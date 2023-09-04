import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { atom, useAtom } from 'jotai';

type ManagePasswordViewType =
  | 'manage-password'
  | 'setup-password'
  | 'password-setup'
  | 'change-password'
  | 'cancel-password';

// const managePwdAtom = atom<ManagePasswordViewType>('manage-password');
const managePwdAtom = atom<ManagePasswordViewType>('cancel-password');

const isShowManagePasswordAtom = atom(!IS_RUNTIME_PRODUCTION);

export const useManagePassword = () => {
  const [managePwdView, setManagePwdView] = useAtom(managePwdAtom);
  const [isShowManagePassword, setIsShowManagePassword] = useAtom(
    isShowManagePasswordAtom
  );
  return {
    managePwdView,
    setManagePwdView,

    isShowManagePassword,
    setIsShowManagePassword,
  };
};
