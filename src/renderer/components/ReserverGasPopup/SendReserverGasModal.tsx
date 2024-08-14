import React from 'react';
import clsx from 'clsx';
import { Modal, ModalProps } from 'antd';
import { GasLevel } from '@rabby-wallet/rabby-api/dist/types';

import {
  ReserveGasContent,
  ReserveGasContentProps,
  ReserveGasType,
} from './ReserverGasModal';
// import { Modal, Props as ModalProps } from '../Modal/Modal';

import styles from './index.module.less';

export const SendReserveGasModal = (
  props: ReserveGasContentProps &
    (Omit<ModalProps, 'onClose' | 'onCancel'> & {
      onCancel?: (gasLevel?: GasLevel | null) => void;
    })
) => {
  const {
    gasList,
    chain,
    onGasChange,
    limit,
    selectedItem,
    rawHexBalance,
    onCancel,
    ...otherModalProps
  } = props;

  const reverseGasContentRef = React.useRef<ReserveGasType>(null);

  const handleCancel = React.useCallback(() => {
    const gasLevel = reverseGasContentRef.current?.getSelectedGasLevel();
    onCancel?.(gasLevel);
  }, [onCancel]);

  return (
    <Modal
      title="Reserve Gas"
      className={styles.ReserveGasModal}
      width={400}
      maskClosable
      destroyOnClose
      closeIcon={null}
      {...otherModalProps}
      onCancel={handleCancel}
    >
      {gasList && (
        <ReserveGasContent
          ref={reverseGasContentRef}
          gasList={gasList}
          chain={chain}
          limit={limit}
          selectedItem={selectedItem}
          onGasChange={onGasChange}
          rawHexBalance={rawHexBalance}
        />
      )}
    </Modal>
  );
};
