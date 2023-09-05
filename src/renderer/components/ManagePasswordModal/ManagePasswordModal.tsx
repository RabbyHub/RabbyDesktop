import React, { useEffect } from 'react';
import { Skeleton } from 'antd';
import clsx from 'clsx';
import { PasswordStatus } from '@/isomorphic/wallet/lock';
import { Modal } from '../Modal/Modal';
import {
  HaveSetupPassword,
  HaventSetupPassWord,
} from './ManagePasswordContent';

import './index.less';
import { useWalletLockInfo, useManagePasswordUI } from './useManagePassword';
import {
  CancelPasswordContent,
  ChangePasswordContent,
  SetUpPasswordContent,
} from './ModifyPassword';

export const ManagePasswordModal: React.FC = () => {
  const {
    managePwdView,
    setManagePwdView,

    isShowManagePassword,
    setIsShowManagePassword,
  } = useManagePasswordUI();

  const { isLoading, lockInfo, fetchLockInfo } = useWalletLockInfo();

  useEffect(() => {
    setManagePwdView('manage-password');

    fetchLockInfo();
  }, [isShowManagePassword, setManagePwdView, fetchLockInfo]);

  const { title, JClassName } = React.useMemo(() => {
    switch (managePwdView) {
      case 'manage-password':
      case 'password-setup':
      default:
        return {
          title: 'Manage Password',
          JClassName: '',
        };

      case 'cancel-password':
        return {
          title: 'Cancel Password',
          JClassName: 'J-cancel-password',
        };
      case 'change-password':
        return {
          title: 'Change Password',
          JClassName: 'J-change-password',
        };

      case 'setup-password':
        return {
          title: 'Set Up Password',
          JClassName: 'J-setup-password',
        };
    }
  }, [managePwdView]);

  return (
    <Modal
      width={480}
      title={title}
      smallTitle
      open={isShowManagePassword}
      onCancel={() => setIsShowManagePassword(false)}
      className={clsx(`manage-password-modal`, JClassName)}
    >
      {isLoading ? (
        <Skeleton active className="w-[100%] h-[100px]" />
      ) : (
        <>
          {managePwdView === 'manage-password' &&
            (lockInfo.pwdStatus !== PasswordStatus.UseBuiltIn ? (
              <HaventSetupPassWord />
            ) : (
              <HaveSetupPassword />
            ))}
          {managePwdView === 'setup-password' && (
            <SetUpPasswordContent className="h-[100%]" />
          )}
          {managePwdView === 'change-password' && (
            <ChangePasswordContent className="h-[100%]" />
          )}
          {managePwdView === 'cancel-password' && (
            <CancelPasswordContent className="h-[100%]" />
          )}
        </>
      )}
    </Modal>
  );
};
