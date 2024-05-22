import GlobalMask from '@/renderer/components/MainWindow/GlobalMask';

import { detectClientOS } from '@/isomorphic/os';
import styles from './index.module.scss';

const isDarwin = detectClientOS() === 'darwin';

export default function RabbyNotificationGasket() {
  return (
    <div className={styles.RabbyNotificationGasket}>
      {isDarwin && <div className={styles.macOSDragger} />}
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
