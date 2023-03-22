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

export const GnosisModal: React.FC<Props> = ({ onSuccess, ...props }) => {
  const [form] = Form.useForm<{
    address: string;
    chain: Chain;
  }>();

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
    const { address, chain } = form.getFieldsValue();

    if (await checkAddress(address, chain)) {
      run(address, chain.id.toString());
    }
  }, [form, run]);

  return (
    <Modal {...props}>
      <Form form={form} className="px-[190px]" onFinish={onAdd}>
        <Form.Item name="address">
          <RabbyInput
            className={classNames(
              'bg-white bg-opacity-10 border border-[#FFFFFF1A] rounded-[4px]',
              'text-[15px] text-white'
            )}
            autoFocus
          />
        </Form.Item>
        <Form.Item name="chain">
          <ChainList />
        </Form.Item>
        <div className="text-center">
          <Button type="primary" htmlType="submit">
            Add
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
