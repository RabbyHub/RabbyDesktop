import { RabbyButton } from '@/renderer/components/Button/RabbyButton';
import { Modal, Props as ModalProps } from '@/renderer/components/Modal/Modal';
import { ERROR } from '@/renderer/hooks/useBundle/error';
import { useBundle } from '@/renderer/hooks/useBundle/useBundle';
import { Form } from 'antd';
import clsx from 'clsx';
import React from 'react';
import { openExternalUrl } from '@/renderer/ipcRequest/app';
import { saveBundleAccountsBalance } from '@/renderer/hooks/useBundle/shared';
import { OKX } from '@/renderer/hooks/useBundle/cex/okx/okx';
import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { InputItem } from './InputItem';
import { BundleSuccessModal } from './BundleSuccessModal';

const ERROR_MESSAGE = {
  [ERROR.PERMISSION_ERROR]:
    'For your safety, please add an account that only has allowed "Enable Reading" in API restrictions.',
  [ERROR.INVALID_KEY]: 'Invalid Key',
  [ERROR.EXISTED]: 'This address is already added',
  [ERROR.UNKNOWN]:
    'Internet connection is unavailable. Your region is not supported by OKX.',
};

export const AddOKXModal: React.FC<ModalProps> = (props) => {
  const {
    account: { preCheck, create },
    okx: { getAssetByAccount },
  } = useBundle();
  const [form] = Form.useForm<{
    apiKey: string;
    apiSecret: string;
    passphrase: string;
    simulated: string;
  }>();
  const [loading, setLoading] = React.useState(false);
  const { onCancel } = props;
  const [openSuccessModal, setOpenSuccessModal] = React.useState(false);
  const [newAccount, setNewAccount] = React.useState<BundleAccount>();

  const onAdd = React.useCallback(async () => {
    setLoading(true);
    const { apiKey, apiSecret, passphrase, simulated } = form.getFieldsValue();

    const err = await preCheck({
      type: 'okx',
      apiKey,
      apiSecret,
      passphrase,
      simulated,
    });

    if (err?.error) {
      form.setFields([
        {
          name: 'apiKey',
          errors: [ERROR_MESSAGE[err.error] || ERROR.INVALID_KEY],
        },
      ]);
      setLoading(false);
      return;
    }

    const result = (await create({
      type: 'okx',
      apiKey,
      apiSecret,
      passphrase,
      simulated,
    })) as OkxAccount;
    setNewAccount(result);
    setLoading(false);
    form.resetFields();
    setOpenSuccessModal(true);

    const accountWithApi = {
      ...result,
      api: new OKX({
        apiKey: result.apiKey,
        apiSecret: result.apiSecret,
        passphrase: result.passphrase,
        nickname: result.nickname,
        simulated: result.simulated,
      }),
    };

    getAssetByAccount(accountWithApi).then((res) => {
      if (!res?.balance) {
        console.error('Failed to get balance from OKX', res);
        return;
      }
      saveBundleAccountsBalance([
        {
          id: result!.id,
          balance: res?.balance,
        },
      ]);
    });
  }, [create, form, getAssetByAccount, preCheck]);

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
      {
        name: 'passphrase',
        errors: [],
      },
      {
        name: 'simulated',
        errors: [],
      },
    ]);
  }, [form]);

  const apiSecret = Form.useWatch('apiSecret', form);
  const apiKey = Form.useWatch('apiKey', form);
  const passphrase = Form.useWatch('passphrase', form);
  const disabledSubmit = !apiKey || !apiSecret || !passphrase || loading;

  const openDocs = () => {
    openExternalUrl('https://www.okx.com/account/my-api');
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
    <Modal {...props} width={1000} centered title="Add OKX Account">
      <div
        onClick={openDocs}
        className={clsx(
          'text-[#8697FF] text-[16px]',
          'text-center mb-[40px] w-full mt-[-20px]',
          'underline cursor-pointer'
        )}
      >
        How to create OKX API Key
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
            <InputItem autoFocus placeholder="API Key" />
          </Form.Item>
          <Form.Item name="apiSecret" className="w-full">
            <InputItem
              autoFocus={false}
              type="password"
              placeholder="Secret Key"
            />
          </Form.Item>
          <Form.Item name="passphrase" className="w-full">
            <InputItem
              autoFocus={false}
              type="password"
              placeholder="Passphrase"
            />
          </Form.Item>
          {!IS_RUNTIME_PRODUCTION && (
            <Form.Item name="simulated" className="w-full">
              <InputItem
                autoFocus={false}
                type="number"
                placeholder="is simulated (only for test)"
              />
            </Form.Item>
          )}
        </div>
        <div className="flex items-center flex-col space-y-[22px]">
          <div className="text-[12px] text-[#FFFFFF99]">
            We only support API key that has read-only access. No data will be
            collected from Rabby.
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
        </div>
      </Form>
    </Modal>
  );
};
