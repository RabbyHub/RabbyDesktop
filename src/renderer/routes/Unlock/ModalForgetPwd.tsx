import React, { useCallback, useState } from 'react';
import { Modal } from '@/renderer/components/Modal/Modal';
import { atom, useAtom } from 'jotai';
import styled from 'styled-components';
import { Button, message } from 'antd';

const StyledModal = styled(Modal)`
  .ant-modal-content {
    height: 280px;
  }

  .inner-wrapper {
    padding-top: 16px;
    padding-bottom: 40px;
    padding-left: 32px;
    padding-right: 32px;
  }

  .tip-reset-pwd {
    color: var(--r-neutral-title-2, #fff);
    text-align: center;
    font-size: 15px;
    font-style: normal;
    font-weight: 400;
    line-height: 22px;

    margin-bottom: 60px;
  }

  .tip-button {
    display: flex;
    margin: 0 auto;
    justify-content: center;
    align-items: center;

    border-radius: 4px;

    color: var(--r-neutral-title-2, #fff);
    text-align: center;
    font-size: 15px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
  }
`;

const showModalForgetPwdAtom = atom(false);

export function useShowModalForgetPwd() {
  const [isShowModalForgetPwd, setIsShowModalForgetPwd] = useAtom(
    showModalForgetPwdAtom
  );

  return {
    isShowModalForgetPwd,
    setIsShowModalForgetPwd,
  };
}

export const ModalForgetPwd: React.FC = () => {
  const { isShowModalForgetPwd, setIsShowModalForgetPwd } =
    useShowModalForgetPwd();

  const [isResetWalletLoading, setIsResetWalletLoading] = useState(false);
  const resetWallet = useCallback(async () => {
    setIsResetWalletLoading(true);
    try {
      window.rabbyDesktop.ipcRenderer.sendMessage(
        '__internal_rpc:app:reset-wallet'
      );
    } catch (e: any) {
      message.error({
        content: (
          <span className="text-white">
            {e?.message || 'Failed to set password'}
          </span>
        ),
        duration: 3,
      });
    } finally {
      setIsResetWalletLoading(false);
    }
  }, []);

  return (
    <StyledModal
      width={480}
      title="Forgot Password"
      smallTitle
      className="common-light-modal"
      open={isShowModalForgetPwd}
      onCancel={() => setIsShowModalForgetPwd(false)}
    >
      <div className="inner-wrapper">
        <p className="tip-reset-pwd">
          Rabby Desktop does not store your password. If you've forgotten your
          password, resetting your data is required
        </p>

        <Button
          className="tip-button w-[200px] h-[48px]"
          type="primary"
          onClick={resetWallet}
          loading={isResetWalletLoading}
        >
          Confirm Reset
        </Button>
      </div>
    </StyledModal>
  );
};
