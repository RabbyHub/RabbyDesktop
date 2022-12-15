/// <reference path="../../preload.d.ts" />

import '@/renderer/css/style.less';

import { Button } from 'antd';
import { useDesktopAppState } from '@/renderer/hooks/useDesktopAppState';
import styles from './GettingStarted.module.less';

export default function GettingStarted() {
  const { redirectToMainWindow, putHasStarted } = useDesktopAppState();

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
          putHasStarted();
          redirectToMainWindow();
        }}
      >
        Getting Started
      </Button>
    </div>
  );
}
