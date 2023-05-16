import { RPCItem } from '@/isomorphic/types/rabbyx';
import RabbyInput from '@/renderer/components/AntdOverwrite/Input';
import ChainIcon from '@/renderer/components/ChainIcon';
import { Modal } from '@/renderer/components/Modal/Modal';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { CHAINS } from '@/renderer/utils/constant';
import { isValidateUrl } from '@/renderer/utils/url';
import { useRequest } from 'ahooks';
import { Button, Form, InputRef } from 'antd';
import clsx from 'clsx';
import { useEffect, useMemo, useRef } from 'react';
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
  const chainInfo = useMemo(() => {
    return chain ? CHAINS[chain] : null;
  }, [chain]);

  const {
    runAsync: validateRPC,
    loading: isValidating,
    cancel: cancelValidate,
    error: validateError,
  } = useRequest(
    async (url: string) => {
      if (!isValidateUrl(url)) {
        throw new Error('Invalid RPC URL');
      }
      let valid = false;
      try {
        valid = await walletController.validateRPC(url, chainInfo?.id);
      } catch (e) {
        throw new Error('RPC authentication failed');
      }
      if (!valid) {
        throw new Error('Invalid Chain ID');
      }
    },
    {
      manual: true,
    }
  );

  const [form] = Form.useForm<{ url: string }>();

  useEffect(() => {
    form.setFieldsValue({
      url: rpc?.url,
    });
  }, [form, rpc?.url]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      cancelValidate();
    }
  }, [cancelValidate, form, open]);

  return (
    <Modal
      className={clsx(styles.modal, styles.editModal)}
      open={open}
      onCancel={onClose}
      centered
      width={480}
      footer={null}
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
            onClick={() => {
              const url = form.getFieldValue(['url']);
              if (url) {
                onSubmit?.(chain, url);
              }
            }}
            loading={isValidating}
            disabled={!!validateError}
          >
            {isValidating ? 'Loading' : 'Save'}
          </Button>
        </footer>
      </div>
    </Modal>
  );
};
