import { Modal } from '@/renderer/components/Modal/Modal';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import React from 'react';
import { useAtom } from 'jotai';
import { visibleTokenListAtom } from '@/renderer/components/TokenActionModal/TokenActionModal';
import { TokenTable } from './TokenTable/TokenTable';

interface Props {
  list: TokenItem[];
  visible: boolean;
  onClose(): void;
}

export const LowAssetsModal: React.FC<Props> = ({ visible, onClose, list }) => {
  const [visibleTokenList, setVisibleTokenList] = useAtom(visibleTokenListAtom);

  React.useEffect(() => {
    setVisibleTokenList(visible);
  }, [visible, setVisibleTokenList]);

  React.useEffect(() => {
    if (!visibleTokenList) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleTokenList]);

  return (
    <Modal
      width={400}
      open={visible}
      onCancel={onClose}
      title={
        list.length > 1
          ? `${list.length} low value tokens`
          : `${list.length} low value token`
      }
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
