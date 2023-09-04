import { Button, Form } from 'antd';
import React from 'react';
import Input from '../AntdOverwrite/Input';

export interface Props {
  onCancel: () => void;
  onConfirm: () => void;
}

export const SetUpPasswordContent: React.FC<Props> = ({
  onCancel,
  onConfirm,
}) => {
  return (
    <section className="setup-password-content">
      <div>
        <Form layout="vertical">
          <Form.Item label="Enter password" className="rabby-antd-input-item">
            <Input />
          </Form.Item>

          <Form.Item label="Confirm password" className="rabby-antd-input-item">
            <Input />
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
