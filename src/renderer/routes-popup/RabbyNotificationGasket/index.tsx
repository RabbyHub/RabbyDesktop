import GlobalMask from '@/renderer/components/MainWindow/GlobalMask';
import styles from './index.module.less';

export default function RabbyNotificationGasket() {
  return (
    <div className={styles.RabbyNotificationGasket}>
      <GlobalMask className={styles.maskInGasket} />
    </div>
  );
}
