import { useAccounts } from '@/renderer/hooks/rabbyx/useAccount';
import { useZPopupLayerOnMain } from '@/renderer/hooks/usePopupWinOnMainwin';
import { Button } from 'antd';
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
    <div className={styles['page-welcome']}>
      <div className={styles.container}>
        <img
          src="rabby-internal://assets/icons/welcome/logo.svg"
          alt=""
          className={styles.logo}
        />
        <img
          src="rabby-internal://assets/icons/welcome/slogan.svg"
          alt=""
          className={styles.slogan}
        />
        <Button
          type="primary"
          className={styles['btn-start']}
          onClick={onClickButton}
        >
          Get started
        </Button>
      </div>

      <InviteCodeModal
        open={visibleInviteCodeModal}
        onCancel={handleCancelModal}
      />
    </div>
  );
}
