import { Modal, ModalProps } from 'antd';

import { ReserveGasContent, ReserveGasContentProps } from './ReserverGasModal';
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
      title="Reserve Gas"
      className={styles.ReserveGasModal}
      width={400}
      maskClosable
      destroyOnClose
      closeIcon={null}
      centered
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
