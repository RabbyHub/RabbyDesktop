import { UIContactBookItem } from '@/isomorphic/types/contact';
import { Modal } from '@/renderer/components/Modal/Modal';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { Button, Input } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

export const StyledModal = styled(Modal)`
  .ant-modal-header {
    padding-top: 24px;

    .ant-modal-title {
      font-weight: 510;
      font-size: 20px;
      line-height: 24px;
    }
  }
  .ant-modal-close-x {
    padding: 24px;
  }

  .ant-modal-body {
    padding-inline: 32px;
    padding-bottom: 40px;

    .ant-input-affix-wrapper {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: 8px;
      font-weight: 500;
      font-size: 13px;
      line-height: 16px;
      color: #ffffff;

      &.ant-input-affix-wrapper-focused {
        box-shadow: none;
      }
    }
    .ant-input {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: 8px;
      font-weight: 500;
      font-size: 13px;
      line-height: 16px;
      color: #ffffff;

      &:focus {
        box-shadow: none;
      }
    }

    .nameInput {
      height: 52px;
    }
    .btnContainer {
      margin-top: 40px;
      display: flex;
      justify-content: center;
    }
    .saveBtn {
      width: 200px;
      height: 48px;
      border-radius: 4px;
      margin: 0 auto;
    }
  }
`;

export const ContactEditModal = ({
  address,
  onOk,
  onCancel,
  open,
}: {
  open: boolean;
  address: string;
  onCancel: () => void;
  onOk: (s: UIContactBookItem) => void;
}) => {
  const [name, setName] = useState('');

  const confirm = useCallback(async () => {
    await walletController.updateAlianName(address, name);
    onOk({ name, address });
  }, [address, name, onOk]);

  useEffect(() => {
    const updateName = async () => {
      if (address) {
        const aliasName = await walletController.getAlianName(address);
        if (aliasName) {
          setName(aliasName);
        }
      }
    };
    updateName();
  }, [address]);

  return (
    <StyledModal
      width={480}
      open={open}
      onCancel={onCancel}
      title="Edit address note"
    >
      <Input
        className="nameInput"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoCorrect="false"
        autoComplete="false"
        autoFocus
      />
      <div className="btnContainer">
        <Button type="primary" onClick={confirm} className="saveBtn">
          Confirm
        </Button>
      </div>
    </StyledModal>
  );
};
