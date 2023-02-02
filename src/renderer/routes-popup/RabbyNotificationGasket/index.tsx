import GlobalMask from '@/renderer/components/MainWindow/GlobalMask';

import { Button } from 'antd';
import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import RcIconClose from './close-btn.svg?rc';
import styles from './index.module.scss';

export default function RabbyNotificationGasket() {
  return (
    <div className={styles.RabbyNotificationGasket}>
      <GlobalMask className={styles.maskInGasket}>
        {!IS_RUNTIME_PRODUCTION && (
          <Button
            className={styles.closeBtn}
            type="primary"
            danger
            onClick={() => {
              window.rabbyDesktop.ipcRenderer.sendMessage(
                '__internal_rpc:rabbyx:close-signwin'
              );
            }}
            icon={<RcIconClose className={styles.closeIcon} />}
          >
            Cancel (Dev only)
          </Button>
        )}
      </GlobalMask>
    </div>
  );
}
