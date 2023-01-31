import { Button, Form, Input } from 'antd';
import React from 'react';
import { Modal } from '../Modal/Modal';
import styles from './WalletConnectModal.module.less';

export interface Props {
  defaultValue: string;
  value: string;
  onChange: (value: string) => void;
  open: boolean;
  onClose: () => void;
}

export const BridgeFormModal: React.FC<Props> = ({
  onChange,
  defaultValue,
  value,
  open,
  onClose,
}) => {
  const { useForm } = Form;
  const [form] = useForm<{ host: string }>();

  const restoreInitial = () => {
    form.setFieldsValue({
      host: defaultValue,
    });
  };

  const init = React.useCallback(async () => {
    form.setFieldsValue({
      host: value,
    });
  }, [form, value]);

  const handleSubmit = async ({ host }: { host: string }) => {
    onChange(host);
    onClose();
  };

  React.useEffect(() => {
    init();
  }, [init]);

  return (
    <Modal
      centered
      title="Bridge server URL"
      width={560}
      open={open}
      onCancel={onClose}
    >
      <Form className={styles.Form} onFinish={handleSubmit} form={form}>
        <Form.Item
          name="host"
          rules={[
            { required: true, message: 'Please input bridge server host' },
            {
              pattern: /^((https|http)?:\/\/)[^\s]+\.[^\s]+/,
              message: 'Please check your host',
            },
          ]}
          className="mb-16"
        >
          <Input
            className={styles.Input}
            placeholder="Host"
            size="large"
            autoFocus
            spellCheck={false}
          />
        </Form.Item>

        <div className="flex justify-end">
          <Button
            className={styles.RestoreButton}
            type="link"
            onClick={restoreInitial}
          >
            Restore initial setting
          </Button>
        </div>

        <div className="flex">
          <Button
            className={styles.SaveButton}
            block
            htmlType="submit"
            type="primary"
          >
            Save
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
