import GlobalMask from '@/renderer/components/MainWindow/GlobalMask';

import styles from './index.module.scss';

export default function RabbyNotificationGasket() {
  return (
    <div className={styles.RabbyNotificationGasket}>
      <GlobalMask
        className={styles.maskInGasket}
        onClick={() => {
          window.rabbyDesktop.ipcRenderer.sendMessage(
            '__internal_rpc:rabbyx:close-signwin'
          );
        }}
      />
    </div>
  );
}
