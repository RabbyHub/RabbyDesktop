/* eslint-disable react-hooks/exhaustive-deps */
import { Form, Input, message } from 'antd';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { useAccountToDisplay } from '@/renderer/hooks/rabbyx/useAccountToDisplay';
import { useAddressManagement } from '@/renderer/hooks/rabbyx/useAddressManagement';
import ImportView from '../Import/components/ImportView/ImportView';
import BlockButton from '../Import/components/BlockButton/BlockButton';
import styles from './ImportByPrivateKey.module.less';

interface FormData {
  privateKey: string;
}

const ImportByPrivateKey = () => {
  const nav = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [form] = Form.useForm<FormData>();
  const { getAllAccountsToDisplay } = useAccountToDisplay();
  const { getHighlightedAddressesAsync } = useAddressManagement();
  const onNext = React.useCallback(
    async ({ privateKey }: FormData) => {
      setLoading(true);
      try {
        const data = await walletController.importPrivateKey(privateKey);
        await getHighlightedAddressesAsync();
        await getAllAccountsToDisplay();
        setLoading(false);
        nav('/welcome/import/successful', {
          state: {
            accounts: data,
          },
        });
      } catch (e: any) {
        message.error(e.message);
      }
    },
    [nav]
  );

  return (
    <ImportView
      title="Import Private Key"
      tips={[
        {
          title: 'What is a private key?',
          description: 'A 64-digit number used to control your assets.',
        },
        {
          title: 'Is it safe to import it in Rabby?',
          description:
            'Yes, it will be stored locally on your browser and only accessible to you. ',
        },
      ]}
    >
      <Form form={form} onFinish={onNext}>
        <div className={styles.inputGroup}>
          <Form.Item
            name="privateKey"
            rules={[
              { required: true, message: 'Please input Private key' },
              {
                // do not allow whitespace characters
                pattern: /^\S*$/,
                message: 'The private key is invalid',
              },
            ]}
          >
            <Input.TextArea
              className={styles.input}
              spellCheck={false}
              placeholder="Enter your Private Key"
              autoSize={{ minRows: 10, maxRows: 10 }}
            />
          </Form.Item>
        </div>

        <Form.Item>
          <BlockButton loading={loading} htmlType="submit">
            Next
          </BlockButton>
        </Form.Item>
      </Form>
    </ImportView>
  );
};

export default ImportByPrivateKey;
