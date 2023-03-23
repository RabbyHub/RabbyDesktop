import { useWalletRequest } from '@/renderer/hooks/useWalletRequest';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { Chain } from '@debank/common';
import { Button, Form } from 'antd';
import classNames from 'classnames';
import React from 'react';
import RabbyInput from '../AntdOverwrite/Input';
import { Modal, Props as ModalProps } from '../Modal/Modal';
import { ChainList } from './ChainList';
import { checkAddress } from './util';

export interface Props extends ModalProps {
  onSuccess: () => void;
}

export const SafeModal: React.FC<Props> = ({ onSuccess, ...props }) => {
  const [form] = Form.useForm<{
    address: string;
    chain: Chain;
  }>();
  const [loading, setLoading] = React.useState(false);

  const [run] = useWalletRequest(walletController.importGnosisAddress, {
    onSuccess(accounts) {
      // success
      onSuccess();
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

  return (
    <Modal {...props}>
      <Form
        onValuesChange={onValuesChange}
        form={form}
        className="px-[190px]"
        onFinish={onAdd}
      >
        <Form.Item name="address">
          <RabbyInput
            className={classNames(
              'bg-white bg-opacity-10 border border-[#FFFFFF1A] rounded-[4px]',
              'text-[15px] text-white'
            )}
            autoFocus
          />
        </Form.Item>
        <Form.Item name="chain" required>
          <ChainList />
        </Form.Item>
        <div className="text-center">
          <Button loading={loading} type="primary" htmlType="submit">
            Add
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
