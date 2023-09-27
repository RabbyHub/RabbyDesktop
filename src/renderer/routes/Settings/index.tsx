import React, { useState } from 'react';

import {
  IconChevronRight,
  IconTooltipInfo,
} from '@/../assets/icons/mainwin-settings';

import { Modal, Tooltip } from 'antd';
import { useSettings } from '@/renderer/hooks/useSettings';
import styled from 'styled-components';
import {
  APP_BRANDNAME,
  FORCE_DISABLE_CONTENT_PROTECTION,
  IS_RUNTIME_PRODUCTION,
} from '@/isomorphic/constants';
import { useWhitelist } from '@/renderer/hooks/rabbyx/useWhitelist';
import { ModalConfirmInSettings } from '@/renderer/components/Modal/Confirm';
import { ucfirst } from '@/isomorphic/string';
import ManageAddressModal from '@/renderer/components/AddressManagementModal/ManageAddress';
import { useShowTestnet } from '@/renderer/hooks/rabbyx/useShowTestnet';
import { ManagePasswordModal } from '@/renderer/components/ManagePasswordModal/ManagePasswordModal';
import {
  useWalletLockInfo,
  useManagePasswordUI,
} from '@/renderer/components/ManagePasswordModal/useManagePassword';
import { requestLockWallet } from '@/renderer/hooks/rabbyx/useUnlocked';
import { PasswordStatus } from '@/isomorphic/wallet/lock';
import { useNavigate } from 'react-router-dom';
import { getRendererAppChannel } from '@/isomorphic/env';
import styles from './index.module.less';
import ModalProxySetting from './components/ModalProxySetting';
import { useProxyStateOnSettingPage } from './settingHooks';
import { ClearPendingModal } from './components/ClearPendingModal';
import { UpdateArea } from './components/UpdateArea';
import { CustomRPCModal } from './components/CustomRPCModal';
import TopTipUnsupported from './components/TopTipUnsupported';
import ModalSupportedChains, {
  CHAINS_TOTAL_COUNT,
  useSupportedChainsModal,
} from './components/ModalSupportedChains';
import { SignatureRecordModal } from './components/SignatureRecordModal';
import {
  ItemText,
  ItemLink,
  ItemAction,
  ItemSwitch,
  ImageAsLink,
} from './SettingArtifacts';

const APP_CHANNEL = getRendererAppChannel();

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
  const [isShowSignatureRecordModal, setIsShowSignatureRecordModal] =
    useState(false);
  const [isManageAddressModal, setIsManageAddressModal] = useState(false);
  const { isShowTestnet, setIsShowTestnet } = useShowTestnet();

  const { setShowSupportedChains } = useSupportedChainsModal();
  const { setIsShowManagePassword } = useManagePasswordUI();

  const { lockInfo } = useWalletLockInfo();

  const nav = useNavigate();

  return (
    <div className={styles.settingsPage}>
      <TopTipUnsupported />

      <UpdateArea />

      <div className={styles.settingItems}>
        <div className={styles.settingBlock}>
          <h4 className={styles.blockTitle}>Features</h4>
          <div className={styles.itemList}>
            <ItemAction
              name="Lock Wallet"
              onClick={() => {
                // If no password set, show set password modal
                if (lockInfo.pwdStatus !== PasswordStatus.Custom) {
                  setIsShowManagePassword(true, true);
                } else {
                  requestLockWallet();
                }
              }}
              icon="rabby-internal://assets/icons/mainwin-settings/icon-lock-wallet.svg"
            >
              <img src={IconChevronRight} />
            </ItemAction>
            <ItemAction
              name="Signature Record"
              icon="rabby-internal://assets/icons/mainwin-settings/icon-signature-record.svg"
              onClick={() => {
                setIsShowSignatureRecordModal(true);
              }}
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
          </div>
        </div>

        <div className={styles.settingBlock}>
          <h4 className={styles.blockTitle}>Settings</h4>
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
                    <span className="text-14 font-medium">
                      Enable Whitelist for sending assets
                    </span>
                    {/* <span className="text-12 text-white opacity-[0.6]">
                      You can only send assets to whitelisted address
                    </span> */}
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
                    <span className="text-14 font-medium">Enable Testnets</span>
                  </div>
                </>
              }
              icon="rabby-internal://assets/icons/mainwin-settings/icon-testnet.svg"
              onChange={(nextEnabled: boolean) => {
                setIsShowTestnet(nextEnabled);
              }}
            />
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
              name="Manage Password"
              onClick={() => {
                setIsShowManagePassword(true);
              }}
              icon="rabby-internal://assets/icons/mainwin-settings/icon-manage-password.svg"
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
            <ItemAction
              name="Clear Pending"
              onClick={() => {
                setIsShowingClearPendingModal(true);
              }}
              icon="rabby-internal://assets/icons/mainwin-settings/icon-clear.svg"
            >
              <img src={IconChevronRight} />
            </ItemAction>
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

        <div className={styles.settingBlock}>
          <h4 className={styles.blockTitle}>About us</h4>
          <div className={styles.itemList}>
            {!IS_RUNTIME_PRODUCTION && (
              <ItemAction
                name="Developer Kits (Dev Only)"
                onClick={() => {
                  nav('/mainwin/settings/developer');
                }}
                icon="rabby-internal://assets/icons/developer-kits/entry.svg"
              >
                <img src={IconChevronRight} />
              </ItemAction>
            )}
            {APP_CHANNEL !== 'prod' && (
              <ItemAction
                name="Debug Kits (Non Production Only)"
                onClick={() => {
                  nav('/mainwin/settings/debug');
                }}
                icon="rabby-internal://assets/icons/developer-kits/entry.svg"
              >
                <img src={IconChevronRight} />
              </ItemAction>
            )}
            <ItemLink
              name="Privacy Policy"
              link="https://rabby.io/docs/privacy"
              icon="rabby-internal://assets/icons/mainwin-settings/privacy-policy.svg"
            />
            <ItemAction
              name="Supported Chains"
              onClick={() => {
                setShowSupportedChains(true);
              }}
              icon="rabby-internal://assets/icons/mainwin-settings/supported-chains.svg"
            >
              <span className="mr-12 text-14 font-medium">
                {CHAINS_TOTAL_COUNT}
              </span>
              <img src={IconChevronRight} />
            </ItemAction>
            <ItemText
              name="Follow Us"
              icon="rabby-internal://assets/icons/mainwin-settings/followus.svg"
            >
              <ImageAsLink
                altName="Twitter"
                className="cursor-pointer w-[16px] h-[16px] opacity-60 hover:opacity-100 ml-0"
                link="https://twitter.com/Rabby_io"
                iconURL="rabby-internal://assets/icons/mainwin-settings/followus-twitter.svg"
                tooltipProps={{ placement: 'top' }}
              />

              <ImageAsLink
                altName="Discord"
                className="cursor-pointer w-[16px] h-[16px] opacity-60 hover:opacity-100 ml-[16px]"
                link="https://discord.gg/seFBCWmUre"
                iconURL="rabby-internal://assets/icons/mainwin-settings/followus-discord.svg"
                tooltipProps={{ placement: 'left' }}
              />
            </ItemText>
          </div>
        </div>
      </div>

      <div className={styles.settingFooter}>
        <ImageAsLink
          altName={APP_BRANDNAME}
          className="cursor-pointer opacity-60 hover:opacity-100"
          link="https://rabby.io/"
          disableTooltip
          iconURL="rabby-internal://assets/icons/mainwin-settings/footer-logo.svg"
        />
      </div>

      <ModalProxySetting />
      <ModalSupportedChains />

      <ManagePasswordModal />

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
      <SignatureRecordModal
        open={isShowSignatureRecordModal}
        onCancel={() => {
          setIsShowSignatureRecordModal(false);
        }}
      />
    </div>
  );
}
