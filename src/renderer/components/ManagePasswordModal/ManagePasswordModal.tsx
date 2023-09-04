import React from 'react';
// import { useZPopupViewState } from '@/renderer/hooks/usePopupWinOnMainwin';
import clsx from 'clsx';
import { Modal } from '../Modal/Modal';
import { ManagePasswordContent } from './ManagePasswordContent';
import { SetUpPasswordContent } from './SetUpPasswordContent';

import './index.less';
import { useManagePassword } from './useManagePassword';
import { CancelPasswordContent, ChangePasswordContent } from './ModifyPassword';

export const ManagePasswordModal: React.FC = () => {
  const {
    managePwdView,
    setManagePwdView,

    isShowManagePassword,
    setIsShowManagePassword,
  } = useManagePassword();

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
          JClassName: '',
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
      {managePwdView === 'manage-password' && (
        <ManagePasswordContent
          onSetUpPassword={() => setManagePwdView('setup-password')}
          // hasPassword={false}
          hasPassword
        />
      )}
      {managePwdView === 'setup-password' && (
        <SetUpPasswordContent
          onCancel={() => setManagePwdView('manage-password')}
          onConfirm={() => setManagePwdView('manage-password')}
        />
      )}
      {managePwdView === 'change-password' && <ChangePasswordContent />}
      {managePwdView === 'cancel-password' && <CancelPasswordContent />}
    </Modal>
  );
};
