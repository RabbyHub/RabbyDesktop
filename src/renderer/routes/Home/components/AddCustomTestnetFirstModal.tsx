import { Modal } from '@/renderer/components/Modal/Modal';
import { Button } from 'antd';
import React from 'react';

interface Props {
  visible: boolean;
  onClose(): void;
  onConfirm?(): void;
}

export const AddCustomTestnetFirstModal: React.FC<Props> = ({
  visible,
  onClose,
  onConfirm,
}) => {
  return (
    <Modal
      width={353}
      open={visible}
      onCancel={onClose}
      title="Please add custom network first"
      bodyStyle={{ padding: '0' }}
      centered
      smallTitle
      closable={false}
    >
      <div className="mt-[-4px] text-center text-[14px] text-r-neutral-body leading-[20px] mb-[40px] px-[20px]">
        You need to add the token after adding the custom network
      </div>
      <div className="border-t-rabby-neutral-line border-0 border-t-[0.5px] border-solid p-[20px]">
        <Button
          type="primary"
          size="large"
          onClick={onConfirm}
          block
          className="h-[48px] rounded-[8px]"
        >
          Add Custom Network
        </Button>
      </div>
    </Modal>
  );
};
