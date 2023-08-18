import React from 'react';
import { Modal, ModalProps } from 'antd';
import clsx from 'clsx';
import styles from './confirmPortal.module.less';
import { wrapModalPromise } from '../WrapPromise';

import RcIconChecked from './confirm-circle-checked.svg';
import RcIconUnchecked from './confirm-circle-unchecked.svg';

interface ModalConfirmAddToWhitelistProps extends ModalProps {
  addressToGrant: string;
  onFinished: (ctx: { isAddToWhitelist: boolean }) => void;
  height?: number | string;
}

export const ModalConfirmAddToWhitelist = ({
  addressToGrant,
  className,
  ...props
}: React.PropsWithChildren<ModalConfirmAddToWhitelistProps>) => {
  const [isAddToWhitelist, setIsAddToWhitelist] = React.useState(false);

  return (
    <Modal
      width={400}
      {...props}
      className={clsx(styles.confirmPortal, className)}
      style={{
        height: 210,
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
        className: styles.confirmButton,
        ghost: true,
      }}
      okButtonProps={{
        className: styles.confirmButton,
        type: 'primary',
      }}
      onOk={(...args) => {
        props.onFinished?.({ isAddToWhitelist });
        props.onOk?.(...args);
      }}
    >
      <div
        className="inline-flex justify-center cursor-pointer"
        onClick={() => {
          setIsAddToWhitelist((prev) => !prev);
        }}
      >
        <img
          src={isAddToWhitelist ? RcIconChecked : RcIconUnchecked}
          className={clsx(styles.icon, 'mr-6')}
        />
        <span className={styles.title}>Add to whitelist</span>
      </div>
    </Modal>
  );
};

export const confirmAddToWhitelistModalPromise =
  wrapModalPromise<ModalConfirmAddToWhitelistProps>(ModalConfirmAddToWhitelist);
