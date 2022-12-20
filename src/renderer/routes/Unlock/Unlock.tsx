import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { Button, Col, Input, message, Row, Form } from 'antd';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Unlock.module.less';

interface FormData {
  password: string;
}

export const Unlock: React.FC = () => {
  const nav = useNavigate();
  const [form] = Form.useForm<FormData>();

  const onNext = React.useCallback(
    async ({ password }: FormData) => {
      try {
        await walletController.unlock(password);
        nav('/', { replace: true });
      } catch (e) {
        message.error('Password is incorrect');
      }
    },
    [nav]
  );

  return (
    <div className={styles.unlock}>
      <Row align="middle" justify="center" className={styles.row}>
        <Col span={9} className={styles.container}>
          <img
            src="rabby-internal://assets/icons/common/logo.svg"
            alt="logo"
            className={styles.logo}
          />
          <h1 className={styles.title}>Rabby Wallet Desktop</h1>
          <Form form={form} onFinish={onNext}>
            <Form.Item name="password">
              <Input
                className={styles.input}
                placeholder="Enter the Password to Unlock"
                type="password"
                suffix={
                  <Button
                    htmlType="submit"
                    type="link"
                    className={styles.button}
                  >
                    <img
                      src="rabby-internal://assets/icons/common/next.svg"
                      alt="next button"
                      className={styles.next}
                    />
                  </Button>
                }
              />
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </div>
  );
};
