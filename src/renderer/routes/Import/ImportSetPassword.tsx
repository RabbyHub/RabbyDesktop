import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { Checkbox, Input, Form, message } from 'antd';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BlockButton from './components/BlockButton/BlockButton';
import ImportView from './components/ImportView/ImportView';
import styles from './ImportSetPassword.module.less';

const MINIMUM_PASSWORD_LENGTH = 8;

interface FormData {
  password: string;
  confirmPassword: string;
  agreement: boolean;
}

const ImportSetPassword = () => {
  const nav = useNavigate();
  const location = useLocation();
  const fromPath = React.useMemo(() => {
    const query = new URLSearchParams(location.search);
    return query.get('from');
  }, [location]);
  const [form] = Form.useForm<FormData>();

  const onNext = React.useCallback(
    async ({ agreement, password }: FormData) => {
      if (!agreement) {
        return;
      }

      try {
        await walletController.boot(password);
        if (fromPath) {
          nav(fromPath);
        }
      } catch (e: any) {
        message.error('Error:', e.message);
      }
    },
    [fromPath, nav]
  );

  if (!fromPath) {
    nav('/welcome/import/home', { replace: true });
    return null;
  }

  return (
    <ImportView
      title="Set Password"
      tips={[
        {
          title: 'Why set a password?',
          description:
            'It will be used to unlock your wallet and encrypt local data',
        },
        {
          title: 'What are the requirements for the password?',
          description: 'Password must be at least 8 characters long',
        },
      ]}
    >
      <Form form={form} onFinish={onNext}>
        <div className={styles.inputGroup}>
          <Form.Item
            name="password"
            rules={[
              {
                required: true,
                message: 'Please input Password',
              },
              {
                min: MINIMUM_PASSWORD_LENGTH,
                message: 'Password must be at least 8 characters long',
              },
              {
                pattern: /^\S*$/,
                message: 'Password cannot contain spaces',
              },
            ]}
          >
            <Input
              className={styles.input}
              placeholder="Set Password"
              type="password"
              autoFocus
              spellCheck={false}
            />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            rules={[
              {
                required: true,
                message: 'Please Confirm Password',
              },
              ({ getFieldValue }) => ({
                validator(_, value: string) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input
              className={styles.input}
              placeholder="Confirm"
              type="password"
              spellCheck={false}
            />
          </Form.Item>
        </div>

        <Form.Item
          name="agreement"
          required
          valuePropName="checked"
          className={styles.agreement}
        >
          <Checkbox className={styles.checkbox}>
            <span className={styles.text}>
              I have read and agree to the <a href="1">Terms of Use</a>
            </span>
          </Checkbox>
        </Form.Item>

        <Form.Item>
          <BlockButton htmlType="submit">Next</BlockButton>
        </Form.Item>
      </Form>
    </ImportView>
  );
};

export default ImportSetPassword;
