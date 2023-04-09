import { RabbyButton } from '@/renderer/components/Button/RabbyButton';
import { Modal, Props as ModalProps } from '@/renderer/components/Modal/Modal';
import { ERROR } from '@/renderer/hooks/useBundle/error';
import { useBundle } from '@/renderer/hooks/useBundle/useBundle';
import { Form } from 'antd';
import clsx from 'clsx';
import React from 'react';
import { InputItem } from './InputItem';

const ERROR_MESSAGE = {
  [ERROR.EXISTED]: 'This address is already added',
  [ERROR.INVALID_KEY]: 'This address is already added',
};

export const AddBTCModal: React.FC<ModalProps> = (props) => {
  const {
    account: { preCheck, create },
  } = useBundle();
  const [form] = Form.useForm<{
    address: string;
  }>();
  const [loading, setLoading] = React.useState(false);
  const { onCancel } = props;

  const onAdd = React.useCallback(async () => {
    setLoading(true);
    const { address } = form.getFieldsValue();

    const err = await preCheck({
      type: 'btc',
      address,
    });

    if (err?.error) {
      form.setFields([
        {
          name: 'address',
          errors: [ERROR_MESSAGE[err.error] || 'Not a valid address'],
        },
      ]);
      setLoading(false);
      return;
    }

    await create({
      type: 'btc',
      address,
    });
    setLoading(false);
    form.resetFields();
    onCancel?.();
  }, [create, form, onCancel, preCheck]);

  const onValuesChange = React.useCallback(() => {
    form.setFields([
      {
        name: 'address',
        errors: [],
      },
    ]);
  }, [form]);

  const address = Form.useWatch('address', form);
  const disabledSubmit = !address || loading;

  return (
    <Modal {...props} width={1000} centered title="Add BTC address">
      <Form
        className={clsx(
          'px-[180px] pb-[80px] h-[485px]',
          'flex flex-col justify-between items-center'
        )}
        onValuesChange={onValuesChange}
        form={form}
        onFinish={onAdd}
      >
        <Form.Item name="address" className="w-full">
          <InputItem />
        </Form.Item>
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
