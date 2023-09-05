import React, { useEffect } from 'react';
import clsx from 'clsx';
import { usePrevious } from 'react-use';
import styled, { css } from 'styled-components';

import { PasswordStatus } from '@/isomorphic/wallet/lock';
import { Modal as RModal, Props as ModalProps } from '../Modal/Modal';
import {
  HaveSetupPassword,
  HaventSetupPassWord,
} from './ManagePasswordContent';

import './index.less';
import {
  useWalletLockInfo,
  useManagePasswordUI,
  ManagePasswordViewType,
  useCollectSubForms,
  SubFormErrorStatics,
} from './useManagePassword';
import {
  CancelPasswordContent,
  ChangePasswordContent,
  SetUpPasswordContent,
} from './ModifyPassword';

const ERROR_FIELD_H = 24;

const Modal = styled<
  React.FC<
    ModalProps & {
      managePwdView: ManagePasswordViewType;
      formErrorCounts: SubFormErrorStatics;
    }
  >
>(RModal)`
  .ant-modal-content .ant-modal-body {
    height: 100%;
  }

  ${({ managePwdView, formErrorCounts }) => {
    return (
      managePwdView === 'setup-password' &&
      css`
        .ant-modal-content {
          height: ${400 +
          (formErrorCounts.setupPwdForm || 0) * ERROR_FIELD_H}px;
        }
      `
    );
  }}
  ${({ managePwdView, formErrorCounts }) => {
    return (
      managePwdView === 'change-password' &&
      css`
        .ant-modal-content {
          height: ${480 +
          (formErrorCounts.changePwdForm || 0) * ERROR_FIELD_H}px;
        }
      `
    );
  }}
  ${({ managePwdView, formErrorCounts }) => {
    return (
      managePwdView === 'cancel-password' &&
      css`
        .ant-modal-content {
          height: ${320 +
          (formErrorCounts.cancelPwdForm || 0) * ERROR_FIELD_H}px;
        }
      `
    );
  }}
`;

export const ManagePasswordModal: React.FC = () => {
  const {
    managePwdView,
    setManagePwdView,

    isShowManagePassword,
    setIsShowManagePassword,
  } = useManagePasswordUI();

  const { lockInfo, fetchLockInfo } = useWalletLockInfo();

  const prevShown = usePrevious(isShowManagePassword);
  useEffect(() => {
    if (!prevShown && isShowManagePassword) {
      setManagePwdView('manage-password');
    }
  }, [prevShown, isShowManagePassword, setManagePwdView]);

  useEffect(() => {
    fetchLockInfo();
  }, [isShowManagePassword, managePwdView, fetchLockInfo]);

  const { title, JClassName } = React.useMemo(() => {
    switch (managePwdView) {
      case 'setup-password':
        return {
          title: 'Set Up Password',
          JClassName: 'J-setup-password',
        };

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
    }
  }, [managePwdView]);

  const { formErrorCounts } = useCollectSubForms();

  return (
    <Modal
      width={480}
      title={title}
      smallTitle
      open={isShowManagePassword}
      onCancel={() => setIsShowManagePassword(false)}
      className={clsx(`manage-password-modal`, JClassName)}
      managePwdView={managePwdView}
      formErrorCounts={formErrorCounts}
    >
      {managePwdView === 'manage-password' &&
        (lockInfo.pwdStatus === PasswordStatus.UseBuiltIn ? (
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
    </Modal>
  );
};
