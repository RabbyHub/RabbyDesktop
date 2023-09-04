import { Button, Form } from 'antd';
import React from 'react';
import Input from '../AntdOverwrite/Input';

export interface Props {
  onCancel?: () => void;
  onConfirm?: () => void;
}

export const ChangePasswordContent: React.FC<Props> = () => {
  return (
    <section className="px-[20px] pb-[20px] flex flex-col justify-between h-[100%]">
      <Form layout="vertical">
        <Form.Item
          name="currentPwd"
          label="Current password"
          className="rabby-antd-input-item mb-20"
        >
          <Input type="password" />
        </Form.Item>

        <Form.Item
          name="newPwd"
          label="New password"
          className="rabby-antd-input-item mb-20"
        >
          <Input type="password" />
        </Form.Item>

        <Form.Item
          name="confirmPwd"
          label="Confirm password"
          className="rabby-antd-input-item"
        >
          <Input type="password" />
        </Form.Item>
      </Form>
      <div className="flex">
        <Button
          className="flex-shrink-1 w-[100%] h-[48px] rabby-antd-default-button"
          type="default"
          ghost
        >
          Cancel
        </Button>
        <div className="flex-shrink-0 placeholder w-[16px]" />
        <Button
          className="flex-shrink-1 w-[100%] h-[48px] rounded-[4px]"
          type="primary"
        >
          Confirm
        </Button>
      </div>
    </section>
  );
};

export const CancelPasswordContent: React.FC<Props> = () => {
  return (
    <section className="px-[20px] pb-[20px] flex flex-col justify-between h-[100%]">
      <div className="text-center">
        <p className="text-r-neutral-body text-[15px] font-normal mb-[40px]">
          By canceling the password setup, you can't lock the app
        </p>
        <Form layout="vertical">
          <Form.Item
            name="currentPwd"
            label="Current password"
            className="rabby-antd-input-item mb-20"
          >
            <Input
              type="password"
              placeholder="Confirm cancellation by entering your password"
            />
          </Form.Item>
        </Form>
      </div>
      <div className="flex">
        <Button
          className="flex-shrink-1 w-[100%] h-[48px] rabby-antd-default-button"
          type="default"
          ghost
        >
          Cancel
        </Button>
        <div className="flex-shrink-0 placeholder w-[16px]" />
        <Button
          className="flex-shrink-1 w-[100%] h-[48px] rounded-[4px]"
          type="primary"
        >
          Confirm
        </Button>
      </div>
    </section>
  );
};
