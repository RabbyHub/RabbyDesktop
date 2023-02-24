import { useAccounts } from '@/renderer/hooks/rabbyx/useAccount';
import { useZPopupLayerOnMain } from '@/renderer/hooks/usePopupWinOnMainwin';
import { Button, Col, Row } from 'antd';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './GettingStarted.module.less';
import InviteCodeModal from './InviteCodeModal';
import { useInvited } from './useInvited';

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
      '__internal_push:rabbyx:session-broadcast-forward-to-desktop',
      (payload) => {
        if (payload.event === 'accountsChanged') {
          fetchAccounts();
        }
      }
    );
  }, [fetchAccounts]);
  const { showZSubview } = useZPopupLayerOnMain();
  const [visibleInviteCodeModal, setVisibleInviteCodeModal] =
    React.useState(false);
  const { isInvited } = useInvited();

  const onClickButton = React.useCallback(() => {
    if (!isInvited) {
      setVisibleInviteCodeModal(true);
      return;
    }
    showZSubview('select-add-address-type-modal', {
      showEntryButton: true,
    });
  }, [showZSubview, isInvited]);

  const handleCancelModal = React.useCallback(
    (isValid: boolean) => {
      if (isValid) {
        showZSubview('select-add-address-type-modal', {
          showEntryButton: true,
        });
      }
      setVisibleInviteCodeModal(false);
    },
    [showZSubview]
  );

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
          onClick={onClickButton}
        >
          Get started
        </Button>
      </Col>
      <img
        src="rabby-internal://assets/icons/common/logo.svg"
        alt="logo"
        className={styles.logo}
      />

      <InviteCodeModal
        open={visibleInviteCodeModal}
        onCancel={handleCancelModal}
      />
    </Row>
  );
}
