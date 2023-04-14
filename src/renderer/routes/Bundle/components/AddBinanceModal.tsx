import { RabbyButton } from '@/renderer/components/Button/RabbyButton';
import { Modal, Props as ModalProps } from '@/renderer/components/Modal/Modal';
import { ERROR } from '@/renderer/hooks/useBundle/error';
import { useBundle } from '@/renderer/hooks/useBundle/useBundle';
import { Form } from 'antd';
import clsx from 'clsx';
import React from 'react';
import { openExternalUrl } from '@/renderer/ipcRequest/app';
import { InputItem } from './InputItem';
import { BundleSuccessModal } from './BundleSuccessModal';

const ERROR_MESSAGE = {
  [ERROR.PERMISSION_ERROR]:
    'For your safety, please add an account that only has allowed "Enable Reading" in API restrictions.',
  [ERROR.INVALID_KEY]: 'Invalid Key',
  [ERROR.EXISTED]: 'This address is already added',
};

export const AddBinanceModal: React.FC<ModalProps> = (props) => {
  const {
    account: { preCheck, create },
  } = useBundle();
  const [form] = Form.useForm<{
    apiKey: string;
    apiSecret: string;
  }>();
  const [loading, setLoading] = React.useState(false);
  const { onCancel } = props;
  const [openSuccessModal, setOpenSuccessModal] = React.useState(false);
  const [newAccount, setNewAccount] = React.useState<BundleAccount>();

  const onAdd = React.useCallback(async () => {
    setLoading(true);
    const { apiKey, apiSecret } = form.getFieldsValue();

    const err = await preCheck({
      type: 'bn',
      apiKey,
      apiSecret,
    });

    if (err?.error) {
      form.setFields([
        {
          name: 'apiKey',
          errors: [ERROR_MESSAGE[err.error] || 'Invalid address'],
        },
      ]);
      setLoading(false);
      return;
    }

    const result = await create({
      type: 'bn',
      apiKey,
      apiSecret,
    });
    setNewAccount(result);
    setLoading(false);
    form.resetFields();
    setOpenSuccessModal(true);
  }, [create, form, preCheck]);

  const onValuesChange = React.useCallback(() => {
    form.setFields([
      {
        name: 'apiKey',
        errors: [],
      },
      {
        name: 'apiSecret',
        errors: [],
      },
    ]);
  }, [form]);

  const apiSecret = Form.useWatch('apiSecret', form);
  const apiKey = Form.useWatch('apiKey', form);
  const disabledSubmit = !apiKey || !apiSecret || loading;

  const openDocs = () => {
    openExternalUrl(
      'https://www.binance.com/en/support/faq/how-to-create-api-360002502072'
    );
  };

  if (openSuccessModal && newAccount) {
    return (
      <BundleSuccessModal
        data={newAccount}
        open={openSuccessModal}
        onCancel={() => {
          setOpenSuccessModal(false);
          onCancel?.();
        }}
      />
    );
  }

  return (
    <Modal {...props} width={1000} centered title="Add Binance Account">
      <div
        onClick={openDocs}
        className={clsx(
          'text-[#8697FF] text-[16px]',
          'text-center mb-[40px] w-full mt-[-20px]',
          'underline cursor-pointer'
        )}
      >
        How to create Binance API Key
      </div>
      <Form
        className={clsx(
          'px-[180px] pb-[80px] h-[485px]',
          'flex flex-col justify-between items-center'
        )}
        onValuesChange={onValuesChange}
        form={form}
        onFinish={onAdd}
      >
        <div className="w-full space-y-[36px]">
          <Form.Item name="apiKey" className="w-full">
            <InputItem autoFocus placeholder="Api Key" />
          </Form.Item>
          <Form.Item name="apiSecret" className="w-full">
            <InputItem
              autoFocus={false}
              type="password"
              placeholder="Secret Key"
            />
          </Form.Item>
        </div>
        <RabbyButton
          className="w-[240px] h-[52px]"
          loading={loading}
          disabled={disabledSubmit}
          type="primary"
          htmlType="submit"
        >
          Add
        </RabbyButton>
      </Form>
    </Modal>
  );
};
