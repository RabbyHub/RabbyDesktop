import { RPCItem } from '@/isomorphic/types/rabbyx';
import { Modal } from '@/renderer/components/Modal/Modal';
import { useCustomRPC } from '@/renderer/hooks/useCustomRPC';
import { useSwitchChainModal } from '@/renderer/hooks/useSwitchChainModal';
import { useMount } from 'ahooks';
import { Button, message } from 'antd';
import { useMemo } from 'react';
import { useSetState } from 'react-use';
import { CHAINS_ENUM } from '@debank/common';
import { CustomtRPCItem } from './CustomRPCItem';
import { EditCustomRPCModal } from './EditCustomRPCModal';
import styles from './index.module.less';

interface CustomRPCModalProps {
  open?: boolean;
  onClose?: () => void;
}

export const CustomRPCModal = ({ open, onClose }: CustomRPCModalProps) => {
  const { data, getAllRPC, setCustomRPC, setRPCEnable, deleteCustomRPC } =
    useCustomRPC();
  const [state, setState] = useSetState<{
    isShowEditModal: boolean;
    chain?: CHAINS_ENUM | null;
    rpc?: RPCItem | null;
    isAdd?: boolean;
  }>({
    isShowEditModal: false,
    chain: null,
    rpc: null,
    isAdd: false,
  });

  const list = useMemo(() => {
    return Object.entries(data).map(([id, rpc]) => {
      return {
        id: id as CHAINS_ENUM,
        rpc,
      };
    });
  }, [data]);

  const { open: openChainModal } = useSwitchChainModal((chain) => {
    setState({
      isShowEditModal: true,
      chain,
      rpc: data[chain],
      isAdd: true,
    });
  });

  const handleAddClick = () => {
    openChainModal();
  };

  const handleEnable = async (id: CHAINS_ENUM, enable: boolean) => {
    await setRPCEnable(id, enable);
    message.success(enable ? 'Opened' : 'Closed');
  };

  const handleDelete = async (id: CHAINS_ENUM) => {
    await deleteCustomRPC(id);
    message.success('Deleted');
  };

  const handleEditClick = ({ id, rpc }: { id: CHAINS_ENUM; rpc: RPCItem }) => {
    setState({
      isShowEditModal: true,
      chain: id,
      rpc,
      isAdd: false,
    });
  };

  const handleEdit = async (chain: CHAINS_ENUM, url: string) => {
    await setCustomRPC(chain, url);
    if (state.isAdd) {
      message.success('Added');
    }
    setState({
      isShowEditModal: false,
      chain: null,
      rpc: null,
    });
  };

  useMount(() => {
    getAllRPC();
  });
  return (
    <>
      <Modal
        className={styles.modal}
        open={open}
        onCancel={onClose}
        centered
        width={480}
        footer={null}
      >
        <div className={styles.content}>
          <header className={styles.modalHeader}>
            <div className={styles.modalTitle}>Custom RPC</div>
            <div className={styles.modalDesc}>
              Enabling custom RPC will replace Rabby's default node. To keep
              using Rabby, disable or remove the custom RPC node.
            </div>
          </header>
          {!list.length ? (
            <div className={styles.modalBody}>
              <div className={styles.empty}>
                <img
                  src="rabby-internal://assets/icons/mainwin-settings/icon-empty.svg"
                  alt=""
                />
                <div className={styles.emptyDesc}>No results</div>
              </div>
            </div>
          ) : (
            <div className={styles.modalBody}>
              {list.map((item) => {
                return (
                  <CustomtRPCItem
                    key={item.id}
                    data={item}
                    onEnable={handleEnable}
                    onEdit={handleEditClick}
                    onDelete={handleDelete}
                  />
                );
              })}
            </div>
          )}
          <footer className={styles.modalFooter}>
            <Button
              type="primary"
              className={styles.modalBtn}
              onClick={handleAddClick}
            >
              Add RPC
            </Button>
          </footer>
        </div>
      </Modal>
      <EditCustomRPCModal
        open={state.isShowEditModal}
        chain={state.chain}
        rpc={state.rpc}
        onClose={() => {
          setState({
            isShowEditModal: false,
            chain: null,
            rpc: null,
          });
        }}
        onSubmit={handleEdit}
      />
    </>
  );
};
