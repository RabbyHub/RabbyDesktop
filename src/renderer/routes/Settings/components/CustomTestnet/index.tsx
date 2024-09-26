import {
  TestnetChain,
  TestnetChainBase,
} from '@/isomorphic/types/customTestnet';
import { Modal } from '@/renderer/components/Modal/Modal';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { updateChainStore } from '@/renderer/utils/chain';
import { matomoRequestEvent } from '@/renderer/utils/matomo-request';
import { useMemoizedFn, useRequest } from 'ahooks';
import { Button, message } from 'antd';
import { sortBy } from 'lodash';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSetState } from 'react-use';
import { CustomTestnetItem } from './components/CustomTestnetItem';
import { EditCustomTestnetModal } from './components/EditTestnetModal';
import { Emtpy } from './components/Empty';
import styles from './index.module.less';

interface ModalProps {
  open?: boolean;
  onClose?: () => void;
}

interface ModalState {
  isShowModal: boolean;
  current?: TestnetChainBase | null;
  isEdit: boolean;
}

export const CustomNetworkModal = ({ open, onClose }: ModalProps) => {
  const { t } = useTranslation();
  const wallet = walletController;

  const [state, setState] = useSetState<ModalState>({
    isShowModal: false,
    current: null,
    isEdit: false,
  });

  const { data: list, runAsync: runGetCustomTestnetList } = useRequest(
    async () => {
      const res = await wallet.getCustomTestnetList();
      console.log('====getCustomTestnetList res:', res);
      updateChainStore({
        testnetList: res,
      });
      return sortBy(res, 'name');
    }
  );

  const handleAddClick = () => {
    setState({
      isShowModal: true,
      current: null,
      isEdit: false,
    });
    matomoRequestEvent({
      category: 'Custom Network',
      action: 'Click Add Network',
    });
  };

  const handleConfirm = useMemoizedFn(async () => {
    setState({
      isShowModal: false,
      current: null,
      isEdit: false,
    });
    await runGetCustomTestnetList();
  });

  const handleRemoveClick = useMemoizedFn(async (item: TestnetChain) => {
    await wallet.removeCustomTestnet(item.id);
    message.success({
      duration: 0.5,
      icon: <i />,
      content: (
        <div>
          <div className="flex gap-4 mb-4">
            <img src="rabby-internal://assets/icons/home/success.svg" />
            {t('global.Deleted')}
          </div>
        </div>
      ),
    });
    await runGetCustomTestnetList();
  });

  const handleEditClick = useMemoizedFn(async (item: TestnetChain) => {
    const next = {
      isShowModal: true,
      current: item,
      isEdit: true,
    };
    setState(next);
  });

  useEffect(() => {
    if (open) {
      runGetCustomTestnetList();
    }
  }, [open, runGetCustomTestnetList]);

  return (
    <>
      <Modal
        className={styles.modal}
        open={open}
        onCancel={onClose}
        centered
        width={400}
        footer={null}
        zIndex={1000}
      >
        <div className={styles.content}>
          <header className={styles.modalHeader}>
            <div className={styles.modalTitle}>
              {t('page.customTestnet.title')}
            </div>
            <div className={styles.modalDesc}>
              {t('page.customTestnet.desc')}
            </div>
          </header>
          {!list?.length ? (
            <Emtpy description={t('page.customTestnet.empty')} />
          ) : (
            <div className="flex flex-col gap-[12px] px-[20px] flex-1 overflow-auto pb-[12px]">
              {list?.map((item) => (
                <CustomTestnetItem
                  item={item as any}
                  key={item.id}
                  className="bg-r-neutral-card1"
                  onEdit={handleEditClick}
                  onRemove={handleRemoveClick}
                  editable
                />
              ))}
            </div>
          )}
          <footer className={styles.modalFooter}>
            <Button
              type="primary"
              className={styles.modalBtn}
              onClick={handleAddClick}
            >
              {t('page.customTestnet.add')}
            </Button>
          </footer>
        </div>
      </Modal>
      <EditCustomTestnetModal
        ctx={{
          ga: {
            source: 'setting',
          },
        }}
        visible={state.isShowModal}
        data={state.current}
        isEdit={state.isEdit}
        onCancel={() => {
          setState({
            isShowModal: false,
            current: null,
            isEdit: false,
          });
        }}
        onChange={(values) => {
          setState((pre) => ({
            ...pre,
            current: {
              ...pre.current!,
              ...values,
            },
          }));
        }}
        onConfirm={handleConfirm}
      />
    </>
  );
};
