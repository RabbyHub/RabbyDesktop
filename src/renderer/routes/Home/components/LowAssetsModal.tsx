import { Modal } from '@/renderer/components/Modal/Modal';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import React from 'react';
import { TokenTable } from './TokenTable/TokenTable';

interface Props {
  list: TokenItem[];
  visible: boolean;
  onClose(): void;
}

export const LowAssetsModal: React.FC<Props> = ({ visible, onClose, list }) => {
  return (
    <Modal
      width={480}
      open={visible}
      onCancel={onClose}
      title={`${list.length} low value assets`}
      bodyStyle={{ height: 527, padding: '0 20px 0' }}
      centered
      smallTitle
    >
      <div>
        <TokenTable
          list={list}
          virtual={{
            height: 570,
            itemSize: 51,
          }}
        />
      </div>
    </Modal>
  );
};
