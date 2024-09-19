import { useRequest } from 'ahooks';
import { Button, Form } from 'antd';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { matomoRequestEvent } from '@/renderer/utils/matomo-request';
import {
  TestnetChain,
  TestnetChainBase,
} from '@/isomorphic/types/customTestnet';
import { Modal } from '@/renderer/components/Modal/Modal';
import { ConfirmModifyRpcModal } from './ConfirmModifyRpcModal';
import { CustomTestnetForm } from './CustomTestnetForm';
import { AddFromChainList } from './AddFromChainList';
import styles from '../index.module.less';

export const EditCustomTestnetModal = ({
  data,
  visible,
  onCancel,
  onConfirm,
  isEdit,
  onChange,
  ctx,
}: {
  isEdit?: boolean;
  data?: TestnetChainBase | null;
  visible: boolean;
  onCancel(): void;
  onConfirm(values: TestnetChain): void;
  onChange?: (values: Partial<TestnetChainBase>) => void;
  ctx?: {
    ga?: {
      source?: string;
    };
  };
}) => {
  const wallet = walletController;
  const [isShowAddFromChainList, setIsShowAddFromChainList] = useState(false);
  const [isShowModifyRpcModal, setIsShowModifyRpcModal] = useState(false);
  const [form] = Form.useForm();
  const [formValues, setFormValues] = useState<Partial<TestnetChainBase>>({});

  const { loading, runAsync: runAddTestnet } = useRequest(
    (
      res: TestnetChainBase,
      resCtx?: {
        ga?: {
          source?: string;
        };
      }
    ) => {
      return isEdit
        ? wallet.updateCustomTestnet(res)
        : wallet.addCustomTestnet(res, resCtx);
    },
    {
      manual: true,
    }
  );

  const handleSubmit = async () => {
    await form.validateFields();
    const values = form.getFieldsValue();
    const res = await runAddTestnet(values, ctx);
    if ('error' in res) {
      form.setFields([
        {
          name: [res.error.key],
          errors: [res.error.message],
        },
      ]);
      if (!isEdit && res.error.status === 'alreadySupported') {
        setIsShowModifyRpcModal(true);
        setFormValues(form.getFieldsValue());
      }
    } else {
      onConfirm?.(res);
    }
  };

  const { t } = useTranslation();

  useEffect(() => {
    if (data && visible) {
      form.setFieldsValue(data);
    }
  }, [data, visible, form]);

  useEffect(() => {
    if (!visible) {
      form.resetFields();
    }
  }, [visible, form]);

  return (
    <Modal
      className={styles.modal}
      open={visible}
      onCancel={onCancel}
      centered
      width={480}
      footer={null}
    >
      <div className={styles.content}>
        <header className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            {t('page.customRpc.EditCustomTestnetModal.title')}
          </div>
        </header>
        <div className="h-[calc(100%-40px)] overflow-auto px-[20px]">
          {isEdit ? null : (
            <div
              className={clsx(
                'flex items-center gap-[8px]',
                'bg-r-blue-light p-[15px] cursor-pointer rounded-[6px]',
                'mb-[20px] border-[1px] border-transparent border-solid',
                'hover:border-rabby-blue-default hover:bg-r-blue-light'
              )}
              onClick={() => {
                setIsShowAddFromChainList(true);
                const source = ctx?.ga?.source || 'setting';
                matomoRequestEvent({
                  category: 'Custom Network',
                  action: 'Click Add From ChanList',
                  label: source,
                });
              }}
            >
              <img src="rabby-internal://assets/icons/custom-testnet/icon-flash.svg" />
              <div className="text-r-neutral-title1 text-[15px] leading-[18px] font-medium">
                {t('page.customRpc.EditCustomTestnetModal.quickAdd')}
              </div>
              <img
                className="ml-auto"
                src="rabby-internal://assets/icons/custom-testnet/icon-right.svg"
              />
            </div>
          )}

          <CustomTestnetForm
            form={form}
            isEdit={isEdit}
            onFieldsChange={() => {
              const values = form.getFieldsValue();
              onChange?.(values);
            }}
          />
        </div>
        <footer className={styles.modalFooter}>
          <Button
            type="primary"
            size="large"
            className="rabby-btn-ghost w-[172px] rounded-[6px]"
            ghost
            onClick={onCancel}
          >
            {t('global.Cancel')}
          </Button>
          <Button
            type="primary"
            loading={loading}
            size="large"
            className="w-[172px] rounded-[6px]"
            onClick={handleSubmit}
          >
            {loading ? t('global.Loading') : t('global.Confirm')}
          </Button>
        </footer>
      </div>
      <AddFromChainList
        visible={isShowAddFromChainList}
        onClose={() => {
          setIsShowAddFromChainList(false);
        }}
        onSelect={(item) => {
          form.setFieldsValue(item);
          setIsShowAddFromChainList(false);
          const source = ctx?.ga?.source || 'setting';
          matomoRequestEvent({
            category: 'Custom Network',
            action: 'Choose ChainList Network',
            label: `${source}_${String(item.id)}`,
          });
        }}
      />
      <ConfirmModifyRpcModal
        visible={isShowModifyRpcModal}
        chainId={formValues.id}
        rpcUrl={formValues.rpcUrl}
        onCancel={() => {
          setIsShowModifyRpcModal(false);
        }}
        onConfirm={() => {
          setIsShowModifyRpcModal(false);
        }}
      />
    </Modal>
  );
};
