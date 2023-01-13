import { useAccounts } from '@/renderer/hooks/rabbyx/useAccount';
import { showMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import { Button, Col, Row } from 'antd';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './GettingStarted.module.less';

export default function GettingStarted() {
  const nav = useNavigate();
  const { hasFetched, accounts, fetchAccounts } = useAccounts();

  React.useEffect(() => {
    if (hasFetched && accounts.length) {
      nav('/', { replace: true });
    }
  }, [accounts.length, hasFetched, nav]);

  React.useEffect(() => {
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:rabbyx:session-broadcast-forward-to-main',
      (payload) => {
        console.log('payload', payload);
        if (payload.event === 'accountsChanged') {
          fetchAccounts();
        }
      }
    );
  }, [fetchAccounts]);

  return (
    <Row className={styles['page-welcome']} align="middle">
      <Col className={styles.container} span={17} offset={3}>
        <div className={styles['page-content']}>
          <div className={styles.slogan}>
            Specialized client for Dapp security
          </div>
          <div className={styles.slogan}>Rabby Wallet Desktop</div>
        </div>
        <Button
          type="primary"
          className={styles['btn-start']}
          onClick={() => {
            showMainwinPopupview(
              { type: 'add-address' },
              { openDevTools: false }
            );
          }}
        >
          Get started
        </Button>
      </Col>
      <img
        src="rabby-internal://assets/icons/common/logo.svg"
        alt="logo"
        className={styles.logo}
      />
    </Row>
  );
}
