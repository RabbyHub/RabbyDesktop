import RabbyInput from '@/renderer/components/AntdOverwrite/Input';
import { Modal } from '@/renderer/components/Modal/Modal';
import { useInvited } from '@/renderer/routes/Welcome/useInvited';
import { Button, Form } from 'antd';
import React from 'react';

const InviteCodeModal: React.FC<{
  open: boolean;
  onCancel: (isInvited: boolean) => void;
}> = ({ open, onCancel }) => {
  const { checkInviteCode, isInvited } = useInvited();
  const [loading, setLoading] = React.useState(false);
  const [formData] = Form.useForm<{
    code: string;
  }>();
  const [errorMessage, setErrorMessage] = React.useState<string>();
  const handleCancel = React.useCallback(
    (val: boolean) => {
      onCancel(val);
      formData.resetFields();
      setErrorMessage(undefined);
    },
    [onCancel, formData]
  );
  const onSubmit = React.useCallback(
    async (values: { code: string }) => {
      setLoading(true);
      setErrorMessage(undefined);
      try {
        const isValid = await checkInviteCode(values.code?.trim());
        if (!isValid) {
          setErrorMessage('Invalid invitation code');
        } else {
          handleCancel(isValid);
        }
      } catch (e: any) {
        console.log(e);
        setErrorMessage(e?.message);
      }
      setLoading(false);
    },
    [checkInviteCode, handleCancel]
  );

  return (
    <div>
      <Modal
        smallTitle
        open={open}
        onCancel={() => handleCancel(isInvited)}
        centered
        width={638}
        title="Enter your invitation code and get started"
      >
        <div className="px-[48px] pt-[12px] h-[104px]">
          <Form onFinish={onSubmit} form={formData}>
            <div className="flex gap-16">
              <Form.Item className="flex-1 mb-16" name="code">
                <RabbyInput autoFocus />
              </Form.Item>
              <Button
                className="w-[166px]"
                loading={loading}
                type="primary"
                htmlType="submit"
              >
                Next
              </Button>
            </div>
            {errorMessage && (
              <div className="text-[#FF7575] text-15">{errorMessage}</div>
            )}
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default InviteCodeModal;
