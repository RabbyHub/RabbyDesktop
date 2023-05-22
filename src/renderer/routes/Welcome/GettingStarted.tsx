import { useAccountFetchStage } from '@/renderer/hooks/rabbyx/useAccount';
import { useZPopupLayerOnMain } from '@/renderer/hooks/usePopupWinOnMainwin';
import { Button } from 'antd';
import React from 'react';
import styles from './GettingStarted.module.less';

export default function GettingStarted() {
  const { showZSubview } = useZPopupLayerOnMain();

  const { isFinishedFetchAccounts } = useAccountFetchStage();

  const onClickButton = React.useCallback(() => {
    showZSubview('select-add-address-type-modal', {
      showEntryButton: true,
    });
  }, [showZSubview]);

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
    </div>
  );
}
