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
    <section>
      <div>
        <Form layout="vertical">
          <Form.Item label="Enter password">
            <Input placeholder="input placeholder" />
          </Form.Item>

          <Form.Item label="Confirm password">
            <Input placeholder="input placeholder" />
          </Form.Item>
        </Form>
      </div>
      <div className="flex gap-8">
        <Button>Cancel</Button>
        <Button>Confirm</Button>
      </div>
    </section>
  );
};
