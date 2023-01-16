import GlobalMask from '@/renderer/components/MainWindow/GlobalMask';
import { hideMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import styles from './index.module.less';
import { SwapByDex } from './swap';

export default function QuickSwapWindow() {
  return (
    <div className={styles.QuickSwapWindow}>
      <GlobalMask
        className={styles.mask}
        onClick={() => {
          hideMainwinPopupview('quick-swap');
          // keep window state, don't reset
        }}
      />
      <div className={styles.container}>
        <SwapByDex />
      </div>
    </div>
  );
}
