import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { openExternalUrl, requestResetApp } from '@/renderer/ipcRequest/app';

import {
  IconChevronRight,
  IconTooltipInfo,
} from '@/../assets/icons/mainwin-settings';

import { Button, Modal, Slider, SwitchProps, Tooltip, message } from 'antd';
import { useSettings } from '@/renderer/hooks/useSettings';
import styled from 'styled-components';
import {
  APP_BRANDNAME,
  DAPP_ZOOM_VALUES,
  FORCE_DISABLE_CONTENT_PROTECTION,
  IS_RUNTIME_PRODUCTION,
} from '@/isomorphic/constants';
import { useWhitelist } from '@/renderer/hooks/rabbyx/useWhitelist';
import { ModalConfirmInSettings } from '@/renderer/components/Modal/Confirm';
import { Switch } from '@/renderer/components/Switch/Switch';
import { ucfirst } from '@/isomorphic/string';
import { forwardMessageTo } from '@/renderer/hooks/useViewsMessage';
import ManageAddressModal from '@/renderer/components/AddressManagementModal/ManageAddress';
import { atom, useAtom } from 'jotai';
import { useShowTestnet } from '@/renderer/hooks/rabbyx/useShowTestnet';
import { walletTestnetOpenapi } from '@/renderer/ipcRequest/rabbyx';
import styles from './index.module.less';
import ModalProxySetting from './components/ModalProxySetting';
import {
  useIsViewingDevices,
  useProxyStateOnSettingPage,
} from './settingHooks';
import ModalDevices from './components/ModalDevices';
import { testRequestDevice } from './components/ModalDevices/useFilteredDevices';
import { ClearPendingModal } from './components/ClearPendingModal';
import { UpdateArea } from './components/UpdateArea';
import { CustomRPCModal } from './components/CustomRPCModal';
import TopTipUnsupported from './components/TopTipUnsupported';

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

function FooterLink({
  className,
  name,
  iconURL,
  text,
  link,
}: React.PropsWithChildren<{
  className?: string;
  name?: string;
  iconURL?: string;
  text?: string;
  link: string;
}>) {
  return (
    <div
      className={classNames(styles.footerLinkItem, className)}
      onClick={() => {
        openExternalUrl(link);
      }}
    >
      {iconURL ? (
        <Tooltip placement="top" title={name}>
          <img alt={name} src={iconURL} />
        </Tooltip>
      ) : (
        <span className={styles.text}>{text || name}</span>
      )}
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

const debugStateAtom =
  atom<IDebugStates['isGhostWindowDebugHighlighted']>(false);
function DeveloperKitsParts() {
  const [isGhostWindowDebugHighlighted, setIsGhostWindowDebugHighlighted] =
    useAtom(debugStateAtom);

  const { setIsViewingDevices } = useIsViewingDevices();
  const { settings, adjustDappViewZoomPercent } = useSettings();

  if (IS_RUNTIME_PRODUCTION) return null;

  return (
    <>
      <div className={styles.settingBlock}>
        <h4 className={styles.blockTitle}>Developer Kits</h4>
        <div className={styles.itemList}>
          <ItemAction
            name="Devices"
            icon="rabby-internal://assets/icons/developer-kits/usb.svg"
            onClick={() => {
              setIsViewingDevices(true);
            }}
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
          </ItemAction>
          <ItemAction
            name="Camera"
            icon="rabby-internal://assets/icons/developer-kits/camera.svg"
          >
            <Button
              type="primary"
              ghost
              className="mr-[8px]"
              onClick={(evt) => {
                evt.stopPropagation();
                window.rabbyDesktop.ipcRenderer
                  .invoke('start-select-camera')
                  .then((result) => {
                    if (result.isCanceled) {
                      message.info('User Canceled');
                    } else {
                      message.success(
                        `[${result.selectId}] Selected camera with ID: ${result.constrains?.label}`
                      );
                    }
                  });
              }}
            >
              <code>Query Selected Camera</code>
            </Button>
            <Button
              type="primary"
              ghost
              className="mr-[8px]"
              onClick={(evt) => {
                evt.stopPropagation();
                window.rabbyDesktop.ipcRenderer
                  .invoke('start-select-camera', { forceUserSelect: true })
                  .then((result) => {
                    if (result.isCanceled) {
                      message.info('User Canceled');
                    } else {
                      message.success(
                        `[${result.selectId}] Selected camera with ID: ${result.constrains?.label}`
                      );
                    }
                  });
              }}
            >
              <code>Force Select Camera</code>
            </Button>
          </ItemAction>
          <ItemSwitch
            checked={isGhostWindowDebugHighlighted}
            icon="rabby-internal://assets/icons/developer-kits/ghost.svg"
            name={
              <>
                <div>
                  <Tooltip
                    trigger="hover"
                    title={
                      <>
                        <ul className="pl-[12px] pl-[8px] pt-[8px]">
                          <li>
                            Ghost window ONLY visible if there's element need to
                            be rendered, otherwise it will be hidden by set
                            opacity to 0.
                          </li>
                          <li className="mt-[8px]">
                            On development, you can enable this option to make
                            it highlighted with light blue background.
                          </li>
                        </ul>
                      </>
                    }
                  >
                    <span className="text-14 font-medium">
                      Toggle Ghost Window Highlight
                      <img
                        className="ml-[4px] w-[18px] h-[18px] inline-block"
                        src="rabby-internal://assets/icons/mainwin-settings/info.svg"
                        alt=""
                      />
                    </span>
                  </Tooltip>
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

          <ItemText
            name="Dapp Zoom Ratio"
            icon="rabby-internal://assets/icons/mainwin-settings/icon-dapp-zoom.svg"
          >
            <Slider
              className="w-[300px]"
              value={settings.experimentalDappViewZoomPercent}
              marks={{
                [DAPP_ZOOM_VALUES.MIN_ZOOM_PERCENT]: {
                  style: { color: '#fff', fontSize: 12 },
                  label: `${DAPP_ZOOM_VALUES.MIN_ZOOM_PERCENT}%`,
                },
                [DAPP_ZOOM_VALUES.DEFAULT_ZOOM_PERCENT]: {
                  style: { color: '#fff', fontSize: 12 },
                  label: `${DAPP_ZOOM_VALUES.DEFAULT_ZOOM_PERCENT}%`,
                },
                [DAPP_ZOOM_VALUES.MAX_ZOOM_PERCENT]: {
                  style: { color: '#fff', fontSize: 12 },
                  label: `${DAPP_ZOOM_VALUES.MAX_ZOOM_PERCENT}%`,
                },
              }}
              tooltip={{
                formatter: (value) => `${value}%`,
              }}
              min={DAPP_ZOOM_VALUES.MIN_ZOOM_PERCENT}
              max={DAPP_ZOOM_VALUES.MAX_ZOOM_PERCENT}
              onChange={(value) => {
                adjustDappViewZoomPercent(value);
              }}
            />
          </ItemText>
        </div>
      </div>
      <ModalDevices />
    </>
  );
}

export function MainWindowSettings() {
  const {
    settings,
    toggleEnableIPFSDapp,
    toggleEnableContentProtection,
    adjustDappViewZoomPercent,
  } = useSettings();

  const { setIsSettingProxy, customProxyServer, proxyType } =
    useProxyStateOnSettingPage();

  const { enable: enabledWhiteList, toggleWhitelist } = useWhitelist();

  const [isShowingClearPendingModal, setIsShowingClearPendingModal] =
    useState(false);
  const [isShowCustomRPCModal, setIsShowCustomRPCModal] = useState(false);
  const [isManageAddressModal, setIsManageAddressModal] = useState(false);
  const { isShowTestnet, setIsShowTestnet } = useShowTestnet();

  return (
    <div className={styles.settingsPage}>
      <TopTipUnsupported />

      <UpdateArea />

      <div className={styles.settingItems}>
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
                        Do you confirm to {nextEnabled
                          ? 'enable'
                          : 'disable'}{' '}
                        it?
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
                    <span className="text-12 text-white opacity-[0.6]">
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
            <ItemSwitch
              checked={isShowTestnet}
              name={
                <>
                  <div className="flex flex-col gap-[4px]">
                    <span className="text-14 font-medium">Show Testnets</span>
                  </div>
                </>
              }
              icon="rabby-internal://assets/icons/mainwin-settings/icon-faucet.svg"
              onChange={(nextEnabled: boolean) => {
                setIsShowTestnet(nextEnabled);
              }}
            />
          </div>
        </div>

        <div className={styles.settingBlock}>
          <h4 className={styles.blockTitle}>General</h4>
          <div className={styles.itemList}>
            <ItemAction
              name="Custom RPC"
              onClick={() => {
                setIsShowCustomRPCModal(true);
              }}
              icon="rabby-internal://assets/icons/mainwin-settings/icon-custom-rpc.svg"
            >
              <img src={IconChevronRight} />
            </ItemAction>
            <ItemAction
              name="Manage Address"
              onClick={() => {
                setIsManageAddressModal(true);
              }}
              icon="rabby-internal://assets/icons/mainwin-settings/icon-manage-address.svg"
            >
              <img src={IconChevronRight} />
            </ItemAction>
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
                    <span className="text-12 text-white opacity-[0.6]">
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
                      It's required to restart client to {keyAction}{' '}
                      Decentralized app, do you want to restart now?
                    </div>
                  ),
                  okText: 'Restart',
                  onOk: () => {
                    toggleEnableIPFSDapp(nextEnabled);
                  },
                });
              }}
            />
            {/* <ItemSwitch
              checked={
                settings.experimentalDappViewZoomPercent ===
                DAPP_ZOOM_VALUES.DEFAULT_ZOOM_PERCENT
              }
              name={
                <>
                  <div className="flex flex-col gap-[4px]">
                    <span className="text-14 font-medium">Dapp Zoom Ratio</span>
                    <span className="text-12 text-white opacity-[0.6]">
                      Once enabled, all dapps will be zoomed to{' '}
                      {DAPP_ZOOM_VALUES.DEFAULT_ZOOM_PERCENT}%
                    </span>
                  </div>
                </>
              }
              icon="rabby-internal://assets/icons/mainwin-settings/icon-dapp-zoom.svg"
              onChange={(nextEnabled: boolean) => {
                if (nextEnabled) {
                  adjustDappViewZoomPercent(
                    DAPP_ZOOM_VALUES.DEFAULT_ZOOM_PERCENT
                  );
                } else {
                  adjustDappViewZoomPercent(100);
                }
              }}
            /> */}
          </div>
        </div>
      </div>

      <div className={styles.settingItems}>
        {!IS_RUNTIME_PRODUCTION && <DeveloperKitsParts />}
      </div>

      <div className={styles.settingFooter}>
        <div className={styles.brandName}>{APP_BRANDNAME}</div>

        <div className={styles.divider} />

        <div className={styles.links}>
          <FooterLink
            name="Website"
            link="https://rabby.io/"
            iconURL="rabby-internal://assets/icons/mainwin-settings/homesite.svg"
          />
          <FooterLink
            name="Discord"
            link="https://discord.gg/seFBCWmUre"
            iconURL="rabby-internal://assets/icons/mainwin-settings/discord.svg"
          />
          <FooterLink
            name="Twitter"
            link="https://twitter.com/Rabby_io"
            iconURL="rabby-internal://assets/icons/mainwin-settings/twitter.svg"
          />
          <FooterLink
            name="Privacy Policy"
            link="https://rabby.io/docs/privacy/"
          />
        </div>
      </div>

      <ModalProxySetting />

      <ClearPendingModal
        open={isShowingClearPendingModal}
        onClose={() => {
          setIsShowingClearPendingModal(false);
        }}
      />
      <CustomRPCModal
        open={isShowCustomRPCModal}
        onClose={() => {
          setIsShowCustomRPCModal(false);
        }}
      />

      <ManageAddressModal
        visible={isManageAddressModal}
        onCancel={() => {
          setIsManageAddressModal(false);
        }}
      />
    </div>
  );
}
