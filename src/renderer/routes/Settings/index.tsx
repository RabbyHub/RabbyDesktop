import React, { useState } from 'react';
import classNames from 'classnames';
import { openExternalUrl, requestResetApp } from '@/renderer/ipcRequest/app';

import { useAppVersion } from '@/renderer/hooks/useMainBridge';
import {
  IconChevronRight,
  IconLink,
  IconTooltipInfo,
} from '@/../assets/icons/mainwin-settings';

import { Button, message, Modal, SwitchProps, Tooltip } from 'antd';
import { useSettings } from '@/renderer/hooks/useSettings';
import styled from 'styled-components';
import {
  APP_BRANDNAME,
  FORCE_DISABLE_CONTENT_PROTECTION,
  IS_RUNTIME_PRODUCTION,
} from '@/isomorphic/constants';
import { useWhitelist } from '@/renderer/hooks/rabbyx/useWhitelist';
import { ModalConfirmInSettings } from '@/renderer/components/Modal/Confirm';
import { Switch } from '@/renderer/components/Switch/Switch';
import { useCheckNewRelease } from '@/renderer/hooks/useAppUpdator';
import { copyText } from '@/renderer/utils/clipboard';
import { detectClientOS } from '@/isomorphic/os';
import { ucfirst } from '@/isomorphic/string';
import {
  forwardMessageTo,
  useMessageForwarded,
} from '@/renderer/hooks/useViewsMessage';
import styles from './index.module.less';
import ModalProxySetting from './components/ModalProxySetting';
import { useProxyStateOnSettingPage } from './settingHooks';
import { AutoUpdate } from './components/AutoUpdate';
import ModalDevices from './components/ModalDevices';
import { testRequestDevice } from './components/ModalDevices/useFilteredDevices';
import { ChangeLog } from './components/ChangeLog';
import { ClearPendingModal } from './components/ClearPendingModal';

type TypedProps = {
  name: React.ReactNode;
  className?: string;
  icon?: string;
  iconBase64?: string;
} & (
  | {
      type: 'text';
      text?: string;
    }
  | {
      type: 'action';
      // onClick?: () => void;
      onClick?: React.DOMAttributes<HTMLDivElement>['onClick'];
    }
  | {
      type: 'switch';
      checked: SwitchProps['checked'];
      onChange?: SwitchProps['onChange'];
    }
  | {
      type: 'link';
      link: string;
      useChevron?: boolean;
    }
);

function ItemPartialLeft({ name, icon }: Pick<TypedProps, 'name' | 'icon'>) {
  return (
    <div className={styles.itemLeft}>
      {icon && <img className={styles.itemIcon} src={icon} />}
      <div className={styles.itemName}>{name}</div>
    </div>
  );
}

function ItemLink({
  children,
  useChevron = false,
  ...props
}: React.PropsWithChildren<Omit<TypedProps & { type: 'link' }, 'type'>>) {
  return (
    <div
      className={classNames(styles.typedItem, styles.pointer, props.className)}
      onClick={() => {
        openExternalUrl(props.link);
      }}
    >
      <ItemPartialLeft name={props.name} icon={props.icon} />
      <div className={styles.itemRight}>
        <div className={styles.itemArrow}>
          {useChevron ? <img src={IconChevronRight} /> : <img src={IconLink} />}
        </div>
      </div>
    </div>
  );
}

function ItemText({
  children,
  ...props
}: React.PropsWithChildren<Omit<TypedProps & { type: 'text' }, 'type'>>) {
  return (
    <div className={classNames(styles.typedItem, props.className)}>
      <ItemPartialLeft name={props.name} icon={props.icon} />
      <div className={styles.itemRight}>{props.text || children}</div>
    </div>
  );
}

function ItemAction({
  children,
  ...props
}: React.PropsWithChildren<Omit<TypedProps & { type: 'action' }, 'type'>>) {
  return (
    <div
      className={classNames(styles.typedItem, styles.pointer, props.className)}
      onClick={props.onClick}
    >
      <ItemPartialLeft name={props.name} icon={props.icon} />
      <div className={styles.itemRight}>{children}</div>
    </div>
  );
}

function ItemSwitch({
  children,
  ...props
}: React.PropsWithChildren<Omit<TypedProps & { type: 'switch' }, 'type'>>) {
  return (
    <div className={classNames(styles.typedItem, props.className)}>
      <ItemPartialLeft name={props.name} icon={props.icon} />
      <div className={styles.itemRight}>
        <Switch checked={props.checked} onChange={props.onChange} />
      </div>
    </div>
  );
}

const ProxyText = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;

  > img {
    margin-left: 4px;
  }

  .custom-proxy-server {
    text-decoration: underline;
  }
`;

const osType = detectClientOS();

function DeveloperKitsParts() {
  const [isGhostWindowDebugHighlighted, setIsGhostWindowDebugHighlighted] =
    useState(false);

  return (
    <>
      {!IS_RUNTIME_PRODUCTION && (
        <div className={styles.settingBlock}>
          <h4 className={styles.blockTitle}>Developer Kits</h4>
          <div className={styles.itemList}>
            <ItemText
              name="Devices"
              icon="rabby-internal://assets/icons/developer-kits/usb.svg"
              // onClick={() => {
              //   setIsViewingDevices(true);
              // }}
            >
              <Button
                type="primary"
                ghost
                onClick={(evt) => {
                  evt.stopPropagation();
                  testRequestDevice();
                }}
              >
                <code>hid.requestDevices()</code>
              </Button>
            </ItemText>
            <ItemSwitch
              checked={isGhostWindowDebugHighlighted}
              icon="rabby-internal://assets/icons/developer-kits/ghost.svg"
              name={
                <>
                  <div className="flex flex-col gap-[4px]">
                    <span className="text-14 font-medium">
                      Toggle Ghost Window Highlight
                    </span>
                    <span className="text-14 text-white opacity-[0.6]" />
                  </div>
                </>
              }
              onChange={(nextEnabled: boolean) => {
                setIsGhostWindowDebugHighlighted(nextEnabled);
                forwardMessageTo('top-ghost-window', 'debug:toggle-highlight', {
                  payload: {
                    isHighlight: nextEnabled,
                  },
                });
              }}
            />
            <ItemAction
              name={<span className={styles.dangerText}>Reset App</span>}
              icon="rabby-internal://assets/icons/mainwin-settings/reset.svg"
              onClick={() => {
                requestResetApp();
              }}
            />
            <ItemAction
              name={<span className={styles.dangerText}>Reset Signs</span>}
              icon="rabby-internal://assets/icons/mainwin-settings/reset.svg"
              onClick={() => {
                window.rabbyDesktop.ipcRenderer.sendMessage(
                  '__internal_rpc:app:reset-rabbyx-approvals'
                );
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

export function MainWindowSettings() {
  const appVerisons = useAppVersion();
  const { settings, toggleEnableIPFSDapp, toggleEnableContentProtection } =
    useSettings();

  const { setIsSettingProxy, customProxyServer, proxyType } =
    useProxyStateOnSettingPage();

  // const { setIsViewingDevices } = useIsViewingDevices();

  const { fetchReleaseInfo } = useCheckNewRelease();

  const { enable: enabledWhiteList, toggleWhitelist } = useWhitelist();

  const [isShowingClearPendingModal, setIsShowingClearPendingModal] =
    useState(false);

  return (
    <div className={styles.settingsPage}>
      {/* TODO: implement Update Area */}
      <div />

      <ModalProxySetting />
      <ModalDevices />

      <div className={styles.settingBlock}>
        <h4 className={styles.blockTitle}>Security</h4>
        <div className={styles.itemList}>
          {!FORCE_DISABLE_CONTENT_PROTECTION && (
            <ItemSwitch
              checked={settings.enableContentProtected}
              name={
                <>
                  <Tooltip
                    trigger="hover"
                    title="Once enabled, content in Rabby will be hidden during screen recording."
                  >
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      Screen Capture Protection
                      <img
                        className={styles.nameTooltipIcon}
                        src={IconTooltipInfo}
                        style={{
                          position: 'relative',
                          top: 1,
                        }}
                      />
                    </span>
                  </Tooltip>
                </>
              }
              icon="rabby-internal://assets/icons/mainwin-settings/content-protection.svg"
              onChange={(nextEnabled: boolean) => {
                Modal.confirm({
                  title: 'Restart Confirmation',
                  content: (
                    <>
                      It's required to restart Rabby App to apply this change.{' '}
                      <br />
                      Do you confirm to {nextEnabled ? 'enable' : 'disable'} it?
                    </>
                  ),
                  onOk: () => {
                    toggleEnableContentProtection(nextEnabled);
                  },
                });
              }}
            />
          )}
          <ItemSwitch
            checked={enabledWhiteList}
            name={
              <>
                <div className="flex flex-col gap-[4px]">
                  <span className="text-14 font-medium">Whitelist</span>
                  <span className="text-14 text-white opacity-[0.6]">
                    You can only send assets to whitelisted address
                  </span>
                </div>
              </>
            }
            icon="rabby-internal://assets/icons/send-token/whitelist.svg"
            onChange={(nextEnabled: boolean) => {
              ModalConfirmInSettings({
                height: 230,
                title: `${nextEnabled ? 'Enable' : 'Disable'} Whitelist`,
                content: nextEnabled ? (
                  <>
                    Once enabled, you can only send assets to the addresses in
                    the whitelist using Rabby.
                  </>
                ) : (
                  <div className="text-center">
                    You can send assets to any address once disabled.
                  </div>
                ),
                onOk: () => {
                  toggleWhitelist(nextEnabled);
                },
              });
            }}
          />
        </div>
      </div>

      <div className={styles.settingBlock}>
        <h4 className={styles.blockTitle}>Dapp</h4>
        <div className={styles.itemList}>
          <ItemSwitch
            checked={settings.enableServeDappByHttp}
            name={
              <>
                <div className="flex flex-col gap-[4px]">
                  <span className="text-14 font-medium">
                    Enable Decentralized app
                  </span>
                  <span className="text-14 text-white opacity-[0.6]">
                    Once enabled, you can use IPFS/ENS/Local Dapp. However,
                    Trezor and Onekey will be affected and can't be used
                    properly.
                  </span>
                </div>
              </>
            }
            icon="rabby-internal://assets/icons/mainwin-settings/icon-dapp.svg"
            onChange={(nextEnabled: boolean) => {
              const keyAction = `${nextEnabled ? 'enable' : 'disable'}`;

              ModalConfirmInSettings({
                height: 230,
                title: `${ucfirst(keyAction)} Decentralized app`,
                content: (
                  <div className="break-words text-left">
                    It's required to restart client to {keyAction} Decentralized
                    app, do you want to restart now?
                  </div>
                ),
                okText: 'Restart',
                onOk: () => {
                  toggleEnableIPFSDapp(nextEnabled);
                },
              });
            }}
          />
        </div>
      </div>

      <div className={styles.settingBlock}>
        <h4 className={styles.blockTitle}>Network</h4>
        <div className={styles.itemList}>
          <ItemAction
            name={
              <ProxyText>
                {proxyType === 'custom' && (
                  <Tooltip title={customProxyServer}>
                    <span>Proxy: Custom</span>
                  </Tooltip>
                )}
                {proxyType === 'system' && <span>Proxy: System</span>}
                {proxyType === 'none' && <span>Proxy: None</span>}
              </ProxyText>
            }
            onClick={() => {
              setIsSettingProxy(true);
            }}
            icon="rabby-internal://assets/icons/mainwin-settings/proxy.svg"
          >
            <img src={IconChevronRight} />
          </ItemAction>
        </div>
      </div>

      <div className={styles.settingBlock}>
        <h4 className={styles.blockTitle}>About</h4>
        <div className={styles.itemList}>
          <ItemAction
            name={[
              `Version: ${appVerisons.version || '-'}`,
              appVerisons.appChannel === 'prod'
                ? ''
                : `-${appVerisons.appChannel}`,
              appVerisons.appChannel === 'prod'
                ? ''
                : ` (${appVerisons.gitRef})`,
            ]
              .filter(Boolean)
              .join('')}
            icon="rabby-internal://assets/icons/mainwin-settings/info.svg"
            onClick={(evt) => {
              if (
                (osType === 'win32' && evt.ctrlKey && evt.altKey) ||
                (osType === 'darwin' && evt.metaKey && evt.altKey)
              ) {
                copyText(
                  [
                    `Version: ${appVerisons.version || '-'}`,
                    `Channel: ${appVerisons.appChannel}`,
                    `Revision: ${appVerisons.gitRef}`,
                  ].join('; ')
                );
                message.open({
                  type: 'info',
                  content: 'Copied Version Info',
                });
                return;
              }

              fetchReleaseInfo().then((releseInfo) => {
                message.open({
                  type: 'info',
                  content: !releseInfo?.hasNewRelease
                    ? 'It is the latest version.'
                    : 'New version is available',
                });
              });
            }}
          >
            <div
              className="flex items-center gap-[20px]"
              onClick={(e) => e.stopPropagation()}
            >
              <ChangeLog />
              <AutoUpdate />
            </div>
          </ItemAction>
          {/* <ItemLink name='User Agreement' /> */}
          <ItemLink
            name="Privacy Policy"
            link="https://rabby.io/docs/privacy/"
            icon="rabby-internal://assets/icons/mainwin-settings/privacy.svg"
          />
          <ItemLink
            name="Website"
            link="https://rabby.io/"
            icon="rabby-internal://assets/icons/mainwin-settings/homesite.svg"
          />
          <ItemLink
            name="Discord"
            link="https://discord.gg/seFBCWmUre"
            icon="rabby-internal://assets/icons/mainwin-settings/discord.svg"
          />
          <ItemLink
            name="Twitter"
            link="https://twitter.com/Rabby_io"
            icon="rabby-internal://assets/icons/mainwin-settings/twitter.svg"
          />
        </div>
      </div>
      <div className={styles.settingBlock}>
        <div className={styles.itemList}>
          <ItemAction
            name="Clear Pending"
            onClick={() => {
              setIsShowingClearPendingModal(true);
            }}
            icon="rabby-internal://assets/icons/mainwin-settings/icon-clear.svg"
          >
            <img src={IconChevronRight} />
          </ItemAction>
        </div>
      </div>

      <DeveloperKitsParts />
      <ClearPendingModal
        open={isShowingClearPendingModal}
        onClose={() => {
          setIsShowingClearPendingModal(false);
        }}
      />
    </div>
  );
}
