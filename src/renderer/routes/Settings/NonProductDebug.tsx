import { requestResetApp } from '@/renderer/ipcRequest/app';

import { getRendererAppChannel } from '@/isomorphic/env';
import {
  Button,
  Divider,
  Input,
  InputProps,
  Modal,
  Switch,
  message,
} from 'antd';
import { useMockFailure } from '@/renderer/hooks/useAppUpdator';
import React, { useCallback, useImperativeHandle } from 'react';
import styles from './index.module.less';

import { ItemAction, ItemLink } from './SettingArtifacts';
import {
  DefaultBackendServiceValues,
  useBackendServiceAPI,
} from './settingHooks';

type ConfirmURLInputType = {
  getValue: () => string;
};

const ConfirmURLInput = React.forwardRef<
  ConfirmURLInputType,
  Omit<InputProps, 'value' | 'onChange'> & {
    initialValue?: string;
    defaultValue: string;
  }
>(({ initialValue = '', defaultValue, ...props }, ref) => {
  const [value, setValue] = React.useState(initialValue);

  useImperativeHandle(ref, () => ({
    getValue: () => {
      return value;
    },
  }));

  return (
    <>
      <p>Restart the app to apply the changes.</p>
      <Input
        {...props}
        value={value}
        onChange={(evt) => {
          setValue(evt.target.value);
        }}
      />

      <Button
        type="link"
        className="pl-0"
        onClick={() => {
          setValue(defaultValue);
        }}
      >
        Restore default value
      </Button>
    </>
  );
});

function DebugKitsParts() {
  const { mockFailureValues, toggleMockFailure } = useMockFailure();

  const { mainnetURL, testnetURL, patchBackendServiceApis } =
    useBackendServiceAPI();

  const confirmURLInputRef = React.useRef<ConfirmURLInputType>(null);
  const confirmURLInputTestRef = React.useRef<ConfirmURLInputType>(null);
  const setBackendServiceAPI = useCallback(
    (isTest = false) => {
      const value = (
        !isTest ? confirmURLInputRef : confirmURLInputTestRef
      ).current?.getValue();
      if (!value) {
        message.error('Invalid URL');
        return;
      }

      return patchBackendServiceApis({
        [!isTest ? 'mainnet' : 'testnet']: value,
      })
        .then(() => {
          message.success('Set Mainnet URL successfully');
          setTimeout(() => {
            window.rabbyDesktop.ipcRenderer.invoke(
              'app-relaunch',
              'dev:backend-service-changed'
            );
          }, 500);
        })
        .catch(() => {
          message.error('Set Mainnet URL failed');
        });
    },
    [patchBackendServiceApis]
  );

  if (getRendererAppChannel() === 'prod') return null;

  return (
    <>
      <div className={styles.settingBlock}>
        <h4 className={styles.blockTitle}>Backend Service API</h4>
        <div className={styles.itemList}>
          <ItemAction
            name={<span>Mainnet URL</span>}
            icon="rabby-internal://assets/icons/mainwin-settings/backend-service-url.svg"
            onClick={() => {
              Modal.confirm({
                title: 'Set Mainnet Backend Service',
                content: (
                  <div>
                    <ConfirmURLInput
                      ref={confirmURLInputRef}
                      initialValue={mainnetURL}
                      defaultValue={DefaultBackendServiceValues.mainnet}
                      placeholder={`Default: ${DefaultBackendServiceValues.mainnet}`}
                    />
                  </div>
                ),
                okText: 'Apply & Restart',
                onOk: () => setBackendServiceAPI(),
              });
            }}
          >
            <div className="flex items-center justify-end">
              <span className="text-r-neutral-body text-12">{mainnetURL}</span>
            </div>
          </ItemAction>
          <ItemAction
            disabled
            name={<span>Testnet URL</span>}
            icon="rabby-internal://assets/icons/mainwin-settings/backend-service-url.svg"
            onClick={() => {
              Modal.confirm({
                title: 'Set Testnet Backend Service',
                content: (
                  <div>
                    <ConfirmURLInput
                      ref={confirmURLInputTestRef}
                      initialValue={testnetURL}
                      defaultValue={DefaultBackendServiceValues.testnet}
                      placeholder={`Default: ${DefaultBackendServiceValues.testnet}`}
                    />
                  </div>
                ),
                okText: 'Apply & Restart',
                onOk: () => setBackendServiceAPI(true),
              });
            }}
          >
            <div className="flex items-center justify-end">
              <span className="text-r-neutral-body text-12">{testnetURL}</span>
            </div>
          </ItemAction>
        </div>
      </div>

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
        </div>
      </div>

      <div className={styles.settingBlock}>
        <h4 className={styles.blockTitle}>Download Updates</h4>
        <div className={styles.itemList}>
          <ItemAction
            name={<span>Clear Downloads</span>}
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
      <div className={styles.settingBlock}>
        <h4 className={styles.blockTitle}>Test Dapps</h4>
        <div className={styles.itemList}>
          <ItemLink
            name="Metamask Test Dapp"
            link="https://metamask.github.io/test-dapp"
            openAsDapp
            icon="rabby-internal://assets/icons/developer-kits/entry.svg"
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
