import React from 'react';

import { ReserveGasContent, ReserveGasContentProps } from './ReserverGasModal';
import { Modal, Props as ModalProps } from '../Modal/Modal';
import styles from './index.module.less';

export const SwapReserveGasModal = (
  props: ReserveGasContentProps & ModalProps
) => {
  const {
    gasList,
    chain,
    onGasChange,
    limit,
    selectedItem,
    rawHexBalance,
    ...otherModalProps
  } = props;

  return (
    <Modal
      className={styles.ReserveGasModal}
      width={400}
      maskClosable
      destroyOnClose
      closeIcon={null}
      {...otherModalProps}
    >
      {gasList && (
        <ReserveGasContent
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
