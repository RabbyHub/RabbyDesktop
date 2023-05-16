import { Button } from 'antd';
import { useCallback } from 'react';
import { Modal } from '@/renderer/components/Modal/Modal';
import { useCheckNewRelease } from '@/renderer/hooks/useAppUpdator';
import { useNavigate } from 'react-router-dom';
import ChangeLogContent from '@/renderer/components/ChangeLogContent';
import { atom, useAtom } from 'jotai';
import styles from './index.module.less';

const hasShownUpdateTipAtom = atom(false);

export default function ModalUpdateInHome() {
  const [hasShown, setHasShown] = useAtom(hasShownUpdateTipAtom);
  const { releaseCheckInfo } = useCheckNewRelease();

  const nav = useNavigate();
  const onGoToSettings = useCallback(() => {
    nav('/mainwin/settings', {
      state: {
        activeUpdateTab: true,
      },
    });
    setHasShown(true);
  }, [nav, setHasShown]);

  if (!releaseCheckInfo?.hasNewRelease || !releaseCheckInfo?.releaseNote) {
    return null;
  }

  if (hasShown) return null;

  return (
    <Modal
      className={styles.changeLogModal}
      open
      maskClosable={false}
      closable
      onCancel={() => setHasShown(true)}
      centered
      width={480}
      footer={null}
    >
      <header className={styles.changeLogHeader}>
        <div className={styles.changeLogTitle}>New Version</div>
        <div className={styles.changeLogVersion}>
          {releaseCheckInfo.releaseVersion}
        </div>
      </header>
      <ChangeLogContent className={styles.changeLogContainer}>
        {releaseCheckInfo?.releaseNote || ''}
      </ChangeLogContent>
      <footer className={styles.changeLogFooter}>
        <Button
          type="primary"
          className="w-[200px] h-[48px] radius-[6px]"
          onClick={onGoToSettings}
        >
          Go update in Settings
        </Button>
      </footer>
    </Modal>
  );
}
