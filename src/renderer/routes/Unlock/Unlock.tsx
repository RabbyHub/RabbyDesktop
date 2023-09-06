import RabbyInput from '@/renderer/components/AntdOverwrite/Input';
import { useUnlocked } from '@/renderer/hooks/rabbyx/useUnlocked';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { Button, message, Form } from 'antd';
import React, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterval } from '@/renderer/hooks/useTimer';

import RcBrandName from '@/../assets/icons/unlock/brand-name.svg?rc';
import clsx from 'clsx';
import { useFormCheckError } from '@/renderer/hooks/useAntdForm';
import { debounce } from 'lodash';
import styles from './Unlock.module.less';
import { ModalForgetPwd, useShowModalForgetPwd } from './ModalForgetPwd';

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

  const doCheck = useCallback(async () => {
    const nextUnlocked = await fetchUnlocked();

    if (nextUnlocked) {
      nav('/mainwin/home', { replace: true });
    }
  }, [fetchUnlocked, nav]);

  useEffect(() => {
    doCheck();
  }, [doCheck]);
  useInterval(async () => {
    doCheck();
  }, 250);

  const { formHasError, triggerCheckFormError } = useFormCheckError(form);

  const { setIsShowModalForgetPwd } = useShowModalForgetPwd();

  return (
    <div className={styles.unlock}>
      <div className={clsx(styles.centerWrapper, 'w-[400px]')}>
        <div className={styles.logoArea}>
          <img
            src="rabby-internal://assets/icons/unlock/logo.svg"
            alt="logo"
            className={styles.logo}
          />
          <RcBrandName
            className={clsx(styles.brandNameSvg, 'mt-[12px] mb-[80px]')}
          />
        </div>
        <Form
          form={form}
          onFinish={onNext}
          onValuesChange={debounce(triggerCheckFormError, 150)}
          className={clsx(styles.form, 'w-[100%]')}
        >
          <Form.Item
            className={clsx('rabby-antd-input-item w-[100%]')}
            name="password"
            // always show success status
            validateStatus="success"
            rules={[
              {
                required: true,
                // message: 'Please input new password!',
                // put empty to hide error info
                message: '',
              },
            ]}
          >
            <RabbyInput
              className={clsx(styles.input, 'w-[100%] h-[56px]')}
              placeholder="Enter the Password to Unlock"
              type="password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              disabled={formHasError}
              htmlType="submit"
              type="primary"
              className="w-[100%] h-[56px] text-[20px] font-medium rounded-6px"
            >
              Unlock
            </Button>
          </Form.Item>

          <div
            className={styles.forgetPwd}
            onClick={() => {
              setIsShowModalForgetPwd(true);
            }}
          >
            Forgot Password
          </div>
        </Form>
      </div>

      <ModalForgetPwd />
    </div>
  );
};
