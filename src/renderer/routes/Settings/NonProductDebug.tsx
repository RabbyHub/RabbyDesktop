import { requestResetApp } from '@/renderer/ipcRequest/app';

import { useSettings } from '@/renderer/hooks/useSettings';
import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { atom } from 'jotai';
import { getRendererAppChannel } from '@/isomorphic/env';
import { message } from 'antd';
import styles from './index.module.less';

import { ItemAction } from './SettingArtifacts';

function DebugKitsParts() {
  if (getRendererAppChannel() === 'prod') return null;

  return (
    <>
      <div className={styles.settingBlock}>
        <h4 className={styles.blockTitle}>Debug Kits</h4>
        <div className={styles.itemList}>
          <ItemAction
            name={<span className={styles.dangerText}>Reset App</span>}
            icon="rabby-internal://assets/icons/mainwin-settings/reset.svg"
            onClick={() => {
              requestResetApp();
            }}
          />
          <ItemAction
            name={<span className={styles.dangerText}>Clear Downloads</span>}
            icon="rabby-internal://assets/icons/mainwin-settings/reset.svg"
            onClick={() => {
              window.rabbyDesktop.ipcRenderer
                .invoke('__internal_invoke:app:debug-kits-actions', {
                  action: 'clean-updates-download-cache',
                })
                .then(() => {
                  message.success('Clear downloads successfully.');
                })
                .catch(() => {
                  message.error('Clear downloads failed.');
                });
            }}
          />
        </div>
      </div>
    </>
  );
}

export function MainWindowSettingsNonProductDebugKits() {
  return (
    <div className={styles.settingsPage}>
      <div className={styles.settingItems}>
        <DebugKitsParts />
      </div>
    </div>
  );
}
