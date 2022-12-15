import { Checkbox, Input } from 'antd';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ImportView from '../Import/components/ImportView/ImportView';
import BlockButton from '../Import/components/BlockButton/BlockButton';
import styles from './ImportByPrivateKey.module.less';

const ImportByPrivateKey = () => {
  const nav = useNavigate();

  const [privateKey, setPrivateKey] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');
  const disabledNextButton = !privateKey;

  const onNext = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!privateKey) {
        setErrorMessage('the private key is invalid');
        return;
      }

      nav('/import/successful');
    },
    [nav, privateKey]
  );

  React.useEffect(() => {
    setErrorMessage('');
  }, [privateKey]);

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
      <form onSubmit={onNext}>
        <div className={styles.inputGroup}>
          <Input.TextArea
            className={styles.input}
            placeholder="Enter your Private Key"
            status={errorMessage ? 'error' : undefined}
            onChange={(e) => setPrivateKey(e.target.value)}
            autoSize={{ minRows: 10, maxRows: 10 }}
          />

          {errorMessage && <div className={styles.error}>{errorMessage}</div>}
        </div>

        <BlockButton htmlType="submit" disabled={disabledNextButton}>
          Next
        </BlockButton>
      </form>
    </ImportView>
  );
};

export default ImportByPrivateKey;
