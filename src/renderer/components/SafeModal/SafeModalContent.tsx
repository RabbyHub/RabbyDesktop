import { useWalletRequest } from '@/renderer/hooks/useWalletRequest';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { Chain } from '@debank/common';
import { Form } from 'antd';
import classNames from 'classnames';
import React from 'react';
import RabbyInput from '../AntdOverwrite/Input';
import { RabbyButton } from '../Button/RabbyButton';
import { ChainList } from './ChainList';
import { checkAddress } from './util';

type Account = import('@/isomorphic/types/rabbyx').Account;

export interface Props {
  onSuccess: (accounts: Account[]) => void;
}

export const SafeModalContent: React.FC<Props> = ({ onSuccess }) => {
  const [form] = Form.useForm<{
    address: string;
    chain: Chain;
  }>();
  const [loading, setLoading] = React.useState(false);

  const [run] = useWalletRequest(walletController.importGnosisAddress, {
    onSuccess(accounts) {
      // success
      onSuccess(accounts);
    },
    onError(err) {
      form.setFields([
        {
          name: 'address',
          errors: [err?.message || 'Not a valid address'],
        },
      ]);
    },
  });

  const onAdd = React.useCallback(async () => {
    setLoading(true);
    const { address, chain } = form.getFieldsValue();
    if (!chain) {
      form.setFields([
        {
          name: 'address',
          errors: ['Please select a chain'],
        },
      ]);
      setLoading(false);
      return;
    }
    try {
      await checkAddress(address, chain);
    } catch (err: any) {
      form.setFields([
        {
          name: 'address',
          errors: [err?.message || 'Not a valid address'],
        },
      ]);
      setLoading(false);
      return;
    }

    await run(address, chain.id.toString());
    setLoading(false);
  }, [form, run]);

  const onValuesChange = React.useCallback(() => {
    form.setFields([
      {
        name: 'address',
        errors: [],
      },
      {
        name: 'chain',
        errors: [],
      },
    ]);
  }, [form]);

  const address = Form.useWatch('address', form);
  const chain = Form.useWatch('chain', form);
  const disabledSubmit = !address || !chain || loading;

  return (
    <Form
      onValuesChange={onValuesChange}
      form={form}
      className="px-[190px] pb-[40px] h-[635px]"
      onFinish={onAdd}
    >
      <Form.Item name="address">
        <RabbyInput
          placeholder="Please input Address"
          className={classNames(
            'py-[15px] px-[24px] rounded-[8px]',
            'bg-white bg-opacity-10 border border-[#FFFFFF1A] rounded-[4px]',
            'text-[15px] leading-[18px] text-white'
          )}
          autoFocus
        />
      </Form.Item>
      <Form.Item className="mt-[36px]" name="chain" required>
        <ChainList />
      </Form.Item>
      <div className="text-center">
        <RabbyButton
          className="w-[240px] h-[52px]"
          loading={loading}
          disabled={disabledSubmit}
          type="primary"
          htmlType="submit"
        >
          Next
        </RabbyButton>
      </div>
    </Form>
  );
};
