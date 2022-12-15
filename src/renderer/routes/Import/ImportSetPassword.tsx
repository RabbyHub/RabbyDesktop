import { Checkbox, Input } from 'antd';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BlockButton from './components/BlockButton/BlockButton';
import ImportView from './components/ImportView/ImportView';
import styles from './ImportSetPassword.module.less';

const ImportSetPassword = () => {
  const nav = useNavigate();
  const location = useLocation();
  const fromPath = React.useMemo(() => {
    const query = new URLSearchParams(location.search);
    return query.get('from');
  }, [location]);
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [agreement, setAgreement] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const disabledNextButton = !password || !confirm || !agreement;

  const onNext = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (password !== confirm) {
        setErrorMessage('Password does not match');
        return;
      }

      if (fromPath) {
        nav(fromPath);
      }
    },
    [confirm, fromPath, nav, password]
  );

  React.useEffect(() => {
    setErrorMessage('');
  }, [password, confirm, agreement]);

  if (!fromPath) {
    nav('/import/home', { replace: true });
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
      <form onSubmit={onNext}>
        <div className={styles.inputGroup}>
          <Input
            className={styles.input}
            placeholder="Set Password"
            type="password"
            status={errorMessage ? 'error' : undefined}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
          />
          <Input
            className={styles.input}
            placeholder="Confirm"
            type="password"
            status={errorMessage ? 'error' : undefined}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={8}
          />
          {errorMessage && <div className={styles.error}>{errorMessage}</div>}
        </div>

        <div className={styles.agreement}>
          <Checkbox
            onChange={(e) => setAgreement(e.target.checked)}
            className={styles.checkbox}
          >
            <span className={styles.text}>
              I have read and agree to the <a href="1">Terms of Use</a>
            </span>
          </Checkbox>
        </div>

        <BlockButton htmlType="submit" disabled={disabledNextButton}>
          Next
        </BlockButton>
      </form>
    </ImportView>
  );
};

export default ImportSetPassword;
