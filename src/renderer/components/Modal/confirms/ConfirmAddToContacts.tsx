import React, { useCallback } from 'react';
import { Modal, ModalProps, message } from 'antd';
import clsx from 'clsx';
import styled from 'styled-components';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import styles from './confirmPortal.module.less';
import { wrapModalPromise } from '../WrapPromise';

import RabbyInput from '../../AntdOverwrite/Input';
import NameAndAddress from '../../NameAndAddress';

interface ModalConfirmAddToContactsProps extends ModalProps {
  initAddressNote?: string;
  addrToAdd: string;
  onFinished: (ctx: { addrToAdd: string }) => void;
  height?: number | string;
}

const NameAndAddressEl = styled(NameAndAddress.Full)`
  &.name-and-address {
    display: inline-flex;

    .address {
      font-size: 13px;
      color: var(--neutral-body, #d3d8e0);
    }
  }
`;

export const ModalConfirmAddToContacts = ({
  onOk,
  onFinished,
  initAddressNote,
  addrToAdd,
  className,
  ...props
}: React.PropsWithChildren<ModalConfirmAddToContactsProps>) => {
  const [addressNote, setAddressNote] = React.useState(initAddressNote || '');

  const handleConfirm = useCallback(async () => {
    try {
      await walletController.addWatchAddressOnly(addrToAdd);
      await walletController.updateAlianName(addrToAdd, addressNote);

      message.success({
        content: <span className="text-white">Added as contacts</span>,
        duration: 3,
      });

      onFinished({ addrToAdd });
    } catch (e: any) {
      message.error({
        content: (
          <span className="text-white">
            {e?.message || 'Failed to add to contacts'}
          </span>
        ),
        duration: 3,
      });
    }
  }, [onFinished, addrToAdd, addressNote]);

  return (
    <Modal
      width={400}
      {...props}
      className={clsx(styles.confirmPortal, className)}
      style={{
        height: 272,
        ...props.style,
      }}
      centered
      closeIcon={
        <img
          className="icon close"
          src="rabby-internal://assets/icons/modal/close.svg"
        />
      }
      closable={false}
      // footer={null}
      open
      cancelButtonProps={{
        className: styles.cancelButton,
        ghost: true,
      }}
      okText="Confirm"
      okButtonProps={{
        className: styles.confirmButton,
        type: 'primary',
        disabled: !addressNote,
      }}
      onOk={handleConfirm}
    >
      <div className="block text-left text-[13px] text-[var(--neutral-foot)]">
        Edit address note
        <div className="w-[100%] pt-8 pb-[16px]">
          <RabbyInput
            value={addressNote}
            className={clsx(styles.input, 'w-[100%]')}
            onChange={(e) => {
              setAddressNote(e.target.value);
            }}
          />
        </div>
        <span className="text-left">
          <NameAndAddressEl
            address={addrToAdd}
            // copyIcon={IconCopy}
            copyIconOpacity={100}
            copyIconClass={clsx('w-[16px] h-[16px] inline-block')}
          />
        </span>
      </div>
    </Modal>
  );
};

export const confirmAddToContactsModalPromise =
  wrapModalPromise<ModalConfirmAddToContactsProps>(ModalConfirmAddToContacts);
