import { Modal, ModalFuncProps } from 'antd';
import clsx from 'clsx';

import styles from './confirm.module.less';
import stylesConfirmInSettings from './confirmInSettings.module.less';

export const ModalConfirm = ({
  className,
  cancelButtonProps,
  height,
  bodyStyle,
  ...other
}: ModalFuncProps & { height?: number | string }) =>
  Modal.confirm({
    icon: <div />,
    closeIcon: (
      <img
        className="icon close"
        src="rabby-internal://assets/icons/modal/close.svg"
      />
    ),
    className: clsx(styles.confirm, className),
    centered: true,
    width: '480px',
    autoFocusButton: null,
    okText: 'Confirm',
    bodyStyle: {
      height,
      ...bodyStyle,
    },
    cancelButtonProps: {
      type: 'ghost',
      ...cancelButtonProps,
    },

    ...other,
  });

export function ModalConfirmInSettings({
  className,
  cancelButtonProps,
  height,
  bodyStyle,
  ...other
}: ModalFuncProps & { height?: number | string }) {
  return Modal.confirm({
    icon: <div />,
    closeIcon: (
      <img
        className="icon close"
        src="rabby-internal://assets/icons/modal/close.svg"
      />
    ),
    closable: true,
    className: clsx(stylesConfirmInSettings.confirmInSettings, className),
    centered: true,
    width: '480px',
    autoFocusButton: null,
    okText: 'Confirm',
    bodyStyle: {
      height,
      ...bodyStyle,
    },
    cancelButtonProps: {
      ghost: true,
      type: 'primary',
      ...cancelButtonProps,
    },

    ...other,
  });
}
