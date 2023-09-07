import { Button, Form, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import { debounce } from 'lodash';
import { requestLockWallet } from '@/renderer/hooks/rabbyx/useUnlocked';
import { useFormCheckError } from '@/renderer/hooks/useAntdForm';
import {
  useWalletLockInfo,
  useManagePasswordUI,
  CancelPasswordForm,
  ChangePasswordForm,
  SetupPasswordForm,
  useCollectSubForms,
} from './useManagePassword';
import Input from '../AntdOverwrite/Input';

const MINIMUM_PASSWORD_LENGTH = 8;
const MINIMUM_PASSWORD_TIP = 'Password must be at least 8 characters long';

export function SetUpPasswordContent({ className }: { className?: string }) {
  const { nextShownToLock, setManagePwdView, setIsShowManagePassword } =
    useManagePasswordUI();

  const { setupPassword } = useWalletLockInfo();

  const [form] = Form.useForm<SetupPasswordForm>();
  const { collectErrorCountFor } = useCollectSubForms();
  const { formErrorCount, triggerCheckFormError } = useFormCheckError(form);
  useEffect(() => {
    collectErrorCountFor('setupPwdForm', formErrorCount);
  }, [collectErrorCountFor, formErrorCount]);

  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const handleSubmit = useCallback(
    async (values: SetupPasswordForm) => {
      setIsSubmitLoading(true);

      try {
        await form.validateFields();
        await setupPassword(values.password);

        message.success({
          content: (
            <span className="text-white">Password set up successfully</span>
          ),
          duration: 3,
        });
        setIsShowManagePassword(false);
        // setManagePwdView('manage-password');

        if (nextShownToLock) {
          requestLockWallet();
        }
      } catch (e: any) {
        message.error({
          content: (
            <span className="text-white">
              {e?.message || 'Failed to set password'}
            </span>
          ),
          duration: 3,
        });
      } finally {
        setIsSubmitLoading(false);
      }
    },
    [form, setupPassword, setIsShowManagePassword, nextShownToLock]
  );

  return (
    <section className={clsx('setup-password-content pt-0', className)}>
      <Form
        layout="vertical"
        form={form}
        onFinish={handleSubmit}
        onValuesChange={debounce(triggerCheckFormError, 150)}
        className="flex flex-col justify-between h-[100%]"
      >
        <div>
          <Form.Item
            label="Enter password"
            className="rabby-antd-input-item"
            name="password"
            rules={[
              {
                required: true,
                message: 'Please input password!',
              },
              {
                min: MINIMUM_PASSWORD_LENGTH,
                message: MINIMUM_PASSWORD_TIP,
              },
            ]}
          >
            <Input
              type="password"
              placeholder={MINIMUM_PASSWORD_TIP}
              autoFocus
            />
          </Form.Item>

          <Form.Item
            label="Confirm password"
            className="rabby-antd-input-item"
            name="confirmPwd"
            rules={[
              {
                required: true,
                message: 'Please input confirm password!',
              },
              {
                async validator(_, value) {
                  const password = form.getFieldValue('password');

                  if (value && password !== value) {
                    return Promise.reject(
                      new Error(
                        'The two passwords that you entered do not match!'
                      )
                    );
                  }
                },
              },
            ]}
          >
            <Input type="password" />
          </Form.Item>
        </div>
        <div className="flex">
          <Button
            className="flex-shrink-1 w-[100%] h-[48px] rabby-antd-default-button"
            type="default"
            ghost
            onClick={() => {
              setManagePwdView('manage-password');
            }}
          >
            Cancel
          </Button>
          <div className="flex-shrink-0 placeholder w-[16px]" />
          <Button
            disabled={!!formErrorCount}
            className="flex-shrink-1 w-[100%] h-[48px] rounded-[4px]"
            type="primary"
            htmlType="submit"
            loading={isSubmitLoading}
          >
            Confirm
          </Button>
        </div>
      </Form>
    </section>
  );
}

const INIT_FORM: ChangePasswordForm = {
  currentPwd: '',
  newPwd: '',
  confirmPwd: '',
};
export function ChangePasswordContent({ className }: { className?: string }) {
  const { setIsShowManagePassword, setManagePwdView } = useManagePasswordUI();

  const { updatePassword } = useWalletLockInfo();

  const [form] = Form.useForm<ChangePasswordForm>();
  const { collectErrorCountFor } = useCollectSubForms();
  const { formErrorCount, triggerCheckFormError } = useFormCheckError(form);
  useEffect(() => {
    collectErrorCountFor('changePwdForm', formErrorCount);
  }, [collectErrorCountFor, formErrorCount]);

  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const handleSubmit = useCallback(
    async (values: ChangePasswordForm) => {
      setIsSubmitLoading(true);

      try {
        await form.validateFields();
        await updatePassword(values.currentPwd, values.newPwd);

        message.success({
          content: (
            <span className="text-white">Password changed successfully</span>
          ),
          duration: 3,
        });
        setIsShowManagePassword(false);
        // setManagePwdView('manage-password');
      } catch (e: any) {
        message.error({
          content: (
            <span className="text-white">
              {e?.message || 'Failed to change password'}
            </span>
          ),
          duration: 3,
        });
      } finally {
        setIsSubmitLoading(false);
      }
    },
    [form, updatePassword, setIsShowManagePassword]
  );

  return (
    <section className={clsx('px-[20px] pb-[20px]', className)}>
      <Form
        layout="vertical"
        form={form}
        onFinish={handleSubmit}
        onValuesChange={debounce(triggerCheckFormError, 150)}
        className="flex flex-col justify-between h-[100%]"
        initialValues={INIT_FORM}
      >
        <div>
          <Form.Item
            label="Current password"
            className={clsx(
              'rabby-antd-input-item',
              form.getFieldError('currentPwd').length > 0 && 'has-error'
            )}
            name="currentPwd"
            rules={[
              {
                required: true,
                message: 'Please input current password!',
              },
            ]}
          >
            <Input type="password" autoFocus />
          </Form.Item>

          <Form.Item
            label="New password"
            className={clsx(
              'rabby-antd-input-item',
              form.getFieldError('newPwd').length > 0 && 'has-error'
            )}
            name="newPwd"
            rules={[
              {
                required: true,
                message: 'Please input new password!',
              },
              {
                min: MINIMUM_PASSWORD_LENGTH,
                message: MINIMUM_PASSWORD_TIP,
              },
            ]}
          >
            <Input type="password" />
          </Form.Item>

          <Form.Item
            label="Confirm password"
            className={clsx(
              'rabby-antd-input-item',
              form.getFieldError('confirmPwd').length > 0 && 'has-error'
            )}
            name="confirmPwd"
            rules={[
              {
                required: true,
                message: 'Please input confirm password!',
              },
              {
                async validator(_, value) {
                  const newPassword = form.getFieldValue('newPwd');

                  if (value && newPassword !== value) {
                    return Promise.reject(
                      new Error(
                        'The two passwords that you entered do not match!'
                      )
                    );
                  }
                },
              },
            ]}
          >
            <Input type="password" />
          </Form.Item>
        </div>
        <div className="flex">
          <Button
            className="flex-shrink-1 w-[100%] h-[48px] rabby-antd-default-button"
            htmlType="button"
            type="default"
            ghost
            onClick={() => setManagePwdView('manage-password')}
          >
            Cancel
          </Button>
          <div className="flex-shrink-0 placeholder w-[16px]" />
          <Button
            disabled={!!formErrorCount}
            className="flex-shrink-1 w-[100%] h-[48px] rounded-[4px]"
            type="primary"
            htmlType="submit"
            loading={isSubmitLoading}
          >
            Confirm
          </Button>
        </div>
      </Form>
    </section>
  );
}

export function CancelPasswordContent({ className }: { className?: string }) {
  const { setManagePwdView, setIsShowManagePassword } = useManagePasswordUI();

  const { cancelPassword } = useWalletLockInfo();

  const [form] = Form.useForm<CancelPasswordForm>();
  const { collectErrorCountFor } = useCollectSubForms();
  const { formErrorCount, triggerCheckFormError } = useFormCheckError(form);
  useEffect(() => {
    collectErrorCountFor('cancelPwdForm', formErrorCount);
  }, [collectErrorCountFor, formErrorCount]);

  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const handleSubmit = useCallback(
    async (values: CancelPasswordForm) => {
      setIsSubmitLoading(true);

      try {
        await form.validateFields();

        await cancelPassword(values.currentPwd);
        setIsShowManagePassword(false);
        message.success({
          content: (
            <span className="text-white">Password cancelled successfully</span>
          ),
          duration: 3,
        });
        // setManagePwdView('manage-password');
      } catch (e: any) {
        message.error({
          content: (
            <span className="text-white">
              {e?.message || 'Failed to cancel password'}
            </span>
          ),
          duration: 3,
        });
      } finally {
        setIsSubmitLoading(false);
      }
    },
    [form, cancelPassword, setIsShowManagePassword]
  );

  return (
    <section className={clsx('px-[20px] pb-[20px]', className)}>
      <Form
        layout="vertical"
        onFinish={handleSubmit}
        onValuesChange={debounce(triggerCheckFormError, 150)}
        className="flex flex-col justify-between h-[100%]"
      >
        <div>
          <div className="text-center mb-[40px]">
            <p className="text-r-neutral-body text-[15px] font-normal mb-0">
              By canceling the password setup, you can't lock the app
            </p>
          </div>
          <Form.Item
            label="Current password"
            className="rabby-antd-input-item"
            name="currentPwd"
            rules={[
              {
                required: true,
                message: 'Please input new password!',
              },
            ]}
          >
            <Input
              type="password"
              placeholder="Confirm cancellation by entering your password"
              autoFocus
            />
          </Form.Item>
        </div>
        <div className="flex">
          <Button
            className="flex-shrink-1 w-[100%] h-[48px] rabby-antd-default-button"
            type="default"
            ghost
            onClick={() => setManagePwdView('manage-password')}
          >
            Cancel
          </Button>
          <div className="flex-shrink-0 placeholder w-[16px]" />
          <Button
            disabled={!!formErrorCount}
            className="flex-shrink-1 w-[100%] h-[48px] rounded-[4px]"
            type="primary"
            htmlType="submit"
            loading={isSubmitLoading}
          >
            Confirm
          </Button>
        </div>
      </Form>
    </section>
  );
}
