import RabbyInput from '@/renderer/components/AntdOverwrite/Input';
import { useUnlocked } from '@/renderer/hooks/rabbyx/useUnlocked';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { Button, Col, Input, message, Row, Form } from 'antd';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterval } from '@/renderer/hooks/useTimer';
import styles from './Unlock.module.less';

interface FormData {
  password: string;
}

export const Unlock: React.FC = () => {
  const nav = useNavigate();
  const [form] = Form.useForm<FormData>();
  const { fetchUnlocked } = useUnlocked();

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

  useInterval(async () => {
    const nextUnlocked = await fetchUnlocked();

    if (nextUnlocked) {
      nav('/mainwin/home', { replace: true });
    }
  }, 250);

  return (
    <div className={styles.unlock}>
      <Row align="middle" justify="center" className={styles.row}>
        <Col span={9} className={styles.container}>
          <img
            src="rabby-internal://assets/icons/common/logo.svg"
            alt="logo"
            className={styles.logo}
          />
          <h1 className={styles.title}>Rabby Desktop</h1>
          <Form form={form} onFinish={onNext}>
            <Form.Item name="password">
              <RabbyInput
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
