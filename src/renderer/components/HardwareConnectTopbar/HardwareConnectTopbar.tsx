import {
  useTopbarTabs,
  useWinTriples,
} from '@/renderer/hooks-shell/useWindowTopbar';
import React from 'react';
import styles from './index.module.less';

export const HardwareConnectTopbar: React.FC = () => {
  const { activeTab } = useTopbarTabs();
  const { winButtonActions } = useWinTriples();

  return (
    <div className={styles.Topbar}>
      <section className={styles.Headline}>
        <div className={styles.Title}>{activeTab?.title}</div>
        <div className={styles.Url}>{activeTab?.url}</div>
      </section>
      <section className={styles.Toolbar}>
        <div className={styles.Button} onClick={winButtonActions.onCloseButton}>
          <img
            alt="close"
            src="rabby-internal://assets/icons/top-bar/close.svg"
          />
        </div>
      </section>
    </div>
  );
};
