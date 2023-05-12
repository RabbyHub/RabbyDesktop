import { useZPopupLayerOnMain } from '@/renderer/hooks/usePopupWinOnMainwin';
import { Button } from 'antd';
import React from 'react';
import { useAccountFetchStage } from '@/renderer/hooks/rabbyx/useAccount';
import styles from './GettingStarted.module.less';
import InviteCodeModal from './InviteCodeModal';
import { useInvited } from './useInvited';

export default function GettingStarted() {
  const { showZSubview } = useZPopupLayerOnMain();
  const [visibleInviteCodeModal, setVisibleInviteCodeModal] =
    React.useState(false);
  const { isFinishedFetchAccounts } = useAccountFetchStage();
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
          disabled={!isFinishedFetchAccounts}
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
