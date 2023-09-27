import { requestResetApp } from '@/renderer/ipcRequest/app';

import { getRendererAppChannel } from '@/isomorphic/env';
import { Divider, Switch, message } from 'antd';
import { useMockFailure } from '@/renderer/hooks/useAppUpdator';
import styles from './index.module.less';

import { ItemAction } from './SettingArtifacts';

function DebugKitsParts() {
  const { mockFailureValues, toggleMockFailure } = useMockFailure();

  if (getRendererAppChannel() === 'prod') return null;

  return (
    <>
      <div className={styles.settingBlock}>
        <h4 className={styles.blockTitle}>Local Cache Manager</h4>
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

      <div className={styles.settingBlock}>
        <h4 className={styles.blockTitle}>Downloads Simulation</h4>
        <div className={styles.itemList}>
          <ItemAction
            name={
              <span>
                Mock Download Exception{' '}
                <span className="text-r-neutral-body text-12">
                  (only valid for this time bootstrap)
                </span>
              </span>
            }
            icon="rabby-internal://assets/icons/mainwin-settings/debugkits/error.svg"
          >
            <div className="flex items-center justify-end">
              <div className="flex items-center justify-center">
                <span className="text-bold mr-[4px]">
                  Always Download Failed
                </span>
                <Switch
                  checked={mockFailureValues.Download}
                  onChange={(nextChecked) => {
                    toggleMockFailure('Download', nextChecked);
                  }}
                  title="Always Download Failed"
                />
              </div>

              <Divider type="vertical" />

              <div className="flex items-center justify-center">
                <span className="text-bold mr-[4px]">Always Verify Failed</span>
                <Switch
                  checked={mockFailureValues.Verify}
                  onChange={(nextChecked) => {
                    toggleMockFailure('Verify', nextChecked);
                  }}
                  title="Always Verify Failed"
                />
              </div>
            </div>
          </ItemAction>
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
