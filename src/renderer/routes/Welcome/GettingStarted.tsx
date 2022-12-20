/// <reference path="../../preload.d.ts" />

import '@/renderer/css/style.less';

import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import styles from './GettingStarted.module.less';

export default function GettingStarted() {
  const nav = useNavigate();

  return (
    <div className={styles['page-welcome']}>
      <div className={styles['page-content']}>
        <div className={styles.slogan}>
          Specialized client for Dapp security
        </div>
        <div className={styles.slogan}>Rabby Wallet Desktop</div>
      </div>
      <Button
        className={styles['btn-start']}
        onClick={() => {
          nav('/welcome/import/home');
        }}
      >
        Getting Started
      </Button>
    </div>
  );
}
