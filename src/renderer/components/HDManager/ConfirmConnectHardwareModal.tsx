import { useZPopupViewState } from '@/renderer/hooks/usePopupWinOnMainwin';
import { Button } from 'antd';
import { useCallback } from 'react';
import { Modal } from '../Modal/Modal';

export default function ConfirmConnectHardwareModal() {
  const { svVisible, svState, closeSubview } = useZPopupViewState(
    'confirm-connect-hardware'
  );

  const doConfirm = useCallback(
    (confirmed: boolean) => {
      if (!svState) return;

      window.rabbyDesktop.ipcRenderer.sendMessage(
        '__internal_rpc:trezor-like:confirm-connect',
        {
          confirmOpenId: svState.confirmOpenId,
          hardwareType: svState.hardwareType,
          confirmed,
        }
      );
      closeSubview();
    },
    [svState, closeSubview]
  );

  return (
    <Modal
      width={480}
      className="h-[268px]"
      open={svVisible}
      onCancel={() => {
        closeSubview();
      }}
    >
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-[20px] text-white">
          Connect to {svState?.hardwareType === 'trezor' ? 'Trezor' : 'OneKey'}
        </div>
        <div className="text-[14px] mt-[14px] text-white opacity-[0.8]">
          Follow the instructions on the pop-up website to complete the
          signature
        </div>
        <div className="flex justify-center w-full mt-[60px]">
          <Button
            type="default"
            ghost
            onClick={() => {
              doConfirm(false);
            }}
          >
            Cancel
          </Button>
          <Button
            className="ml-8px"
            type="primary"
            onClick={() => {
              doConfirm(true);
            }}
          >
            Connect
          </Button>
        </div>
      </div>
    </Modal>
  );
}
