import { RPCItem } from '@/isomorphic/types/rabbyx';
import RabbyInput from '@/renderer/components/AntdOverwrite/Input';
import ChainIcon from '@/renderer/components/ChainIcon';
import { Modal } from '@/renderer/components/Modal/Modal';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { isValidateUrl } from '@/renderer/utils/url';
import { useMemoizedFn, useRequest } from 'ahooks';
import { Button, Form } from 'antd';
import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { findChain } from '@/renderer/utils/chain';
import styles from './index.module.less';

interface EditCustomRPCModalProps {
  open?: boolean;
  chain?: CHAINS_ENUM | null;
  rpc?: RPCItem | null;
  onClose?: () => void;
  onSubmit?: (chain: CHAINS_ENUM, url: string) => void;
}

export const EditCustomRPCModal = ({
  open,
  chain,
  rpc,
  onClose,
  onSubmit,
}: EditCustomRPCModalProps) => {
  const [isValid, setIsValid] = useState(true);
  const chainInfo = useMemo(() => {
    return chain ? findChain({ enum: chain }) : null;
  }, [chain]);
  const [form] = Form.useForm<{ url: string }>();

  const {
    runAsync: validateRPC,
    loading: isValidating,
    cancel: cancelValidate,
  } = useRequest(
    async (url: string) => {
      if (!isValidateUrl(url)) {
        setIsValid(false);
        throw new Error('Invalid RPC URL');
      }
      try {
        const valid = await walletController.validateRPC(url, chainInfo?.id);
        setIsValid(valid);
      } catch (e) {
        setIsValid(false);
        throw new Error('RPC authentication failed');
      }
      if (!isValid) {
        throw new Error('Invalid Chain ID');
      }
    },
    {
      manual: true,
    }
  );

  const onConfirm = useMemoizedFn(async () => {
    try {
      const { url } = await form.validateFields();
      if (isValid && chain && url) {
        onSubmit?.(chain, url);
      }
    } catch (errorInfo) {
      setIsValid(false);
    }
  });

  useEffect(() => {
    if (!open) {
      form.resetFields();
      cancelValidate();
      return;
    }

    if (!rpc?.url) return;
    form.setFieldsValue({
      url: rpc?.url,
    });
  }, [form, rpc?.url, open, cancelValidate]);

  return (
    <Modal
      className={clsx(styles.modal, styles.editModal)}
      open={open}
      onCancel={onClose}
      centered
      width={400}
      footer={null}
      zIndex={1004}
    >
      <div className={styles.content}>
        <header className={styles.modalHeader}>
          <div className={styles.modalTitle}>Edit RPC</div>
        </header>
        <div className={styles.modalBody}>
          <div className={styles.chain}>
            <ChainIcon chain={chain} className={styles.chainIcon} />
            <div className={styles.chainName}>{chainInfo?.name}</div>
          </div>
          <Form layout="vertical" form={form}>
            <Form.Item
              label="RPC URL"
              name="url"
              requiredMark={false}
              normalize={(value) => value?.trim()}
              required
              rules={[
                {
                  validator: (_, value) => {
                    return validateRPC(value);
                  },
                },
              ]}
            >
              <RabbyInput
                className={styles.input}
                placeholder="Enter the RPC URL"
                autoFocus
              />
            </Form.Item>
          </Form>
        </div>
        <footer className={styles.modalFooter}>
          <Button
            type="primary"
            className={styles.modalBtn}
            onClick={onConfirm}
            loading={isValidating}
          >
            {isValidating ? 'Loading' : 'Save'}
          </Button>
        </footer>
      </div>
    </Modal>
  );
};
