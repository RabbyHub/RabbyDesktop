import React from 'react';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { useAsyncRetry } from 'react-use';
import { HARDWARE_KEYRING_TYPES } from '@/renderer/utils/constant';
import { Modal as AntdModal } from 'antd';
import {
  AdvancedSettings,
  DEFAULT_SETTING_DATA,
  SettingData,
} from '../AdvancedSettings';
import { HDPathType } from '../HDPathTypeButton';
import { MainContainer } from '../MainContainer';
import { HDManagerStateContext } from '../utils';
import { Modal } from '../../Modal/Modal';

interface Props {
  brand?: string;
  onClose: () => void;
}

const KEYSTONE_TYPE = HARDWARE_KEYRING_TYPES.Keystone.type;

export const QRCodeManager: React.FC<Props> = ({ brand, onClose }) => {
  const [loading, setLoading] = React.useState(true);
  const { getCurrentAccounts, currentAccounts, keyringId } = React.useContext(
    HDManagerStateContext
  );
  const [visibleAdvanced, setVisibleAdvanced] = React.useState(false);
  const [setting, setSetting] =
    React.useState<SettingData>(DEFAULT_SETTING_DATA);
  const [firstFetchAccounts, setFirstFetchAccounts] = React.useState(false);
  const currentAccountsRef = React.useRef(currentAccounts);

  const openAdvanced = React.useCallback(() => {
    if (loading) {
      return;
    }
    setVisibleAdvanced(true);
  }, [loading]);

  const fetchCurrentAccounts = React.useCallback(async () => {
    setLoading(true);
    await getCurrentAccounts();
    setSetting({
      ...setting,
      type: HDPathType.BIP44,
    });
    setLoading(false);
  }, [getCurrentAccounts, setting]);
  const fetchCurrentAccountsRetry = useAsyncRetry(fetchCurrentAccounts);

  const onConfirmAdvanced = React.useCallback(
    async (data: SettingData) => {
      setVisibleAdvanced(false);
      await fetchCurrentAccounts();
      setSetting({
        ...data,
        type: HDPathType.BIP44,
      });
    },
    [fetchCurrentAccounts]
  );

  React.useEffect(() => {
    currentAccountsRef.current = currentAccounts;
  }, [currentAccounts]);

  React.useEffect(() => {
    if (fetchCurrentAccountsRetry.loading) {
      return;
    }
    const errMessage = fetchCurrentAccountsRetry.error?.message ?? '';
    if (!errMessage) {
      setFirstFetchAccounts(true);
    }
  }, [fetchCurrentAccountsRetry.loading, fetchCurrentAccountsRetry.error]);

  const openSwitchHD = React.useCallback(async () => {
    AntdModal.error({
      title: `Switch to a new ${brand} device`,
      content: `It's not supported to import multiple ${brand} devices If you switch to a new ${brand} device, the current device's address list will be removed before starting the import process.`,
      okText: 'Confirm',
      wrapClassName: 'ErrorModal',
      onOk: async () => {
        await Promise.all(
          currentAccountsRef.current?.map(async (account) =>
            walletController.removeAddress(
              account.address,
              KEYSTONE_TYPE,
              undefined,
              true
            )
          )
        );
        await walletController.requestKeyring(
          KEYSTONE_TYPE,
          'forgetDevice',
          keyringId
        );
        onClose();
      },
      okCancel: false,
      centered: true,
      closable: true,
      maskClosable: true,
      className: 'hd-manager-switch-modal',
    });
  }, [brand, keyringId, onClose]);

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-item" onClick={openSwitchHD}>
          <img
            className="icon"
            src="rabby-internal://assets/icons/hd-manager/setting.svg"
          />
          <span className="title">Switch to another {brand}</span>
        </div>
        <div className="toolbar-item" onClick={openAdvanced}>
          <img
            className="icon"
            src="rabby-internal://assets/icons/hd-manager/setting.svg"
          />
          <span className="title">Advanced Settings</span>
        </div>
      </div>

      <MainContainer
        firstFetchAccounts={firstFetchAccounts}
        setting={setting}
        loading={loading}
        HDName={brand ?? ''}
      />

      <Modal
        destroyOnClose
        className="AdvancedModal inherit"
        title="Custom Address HD path"
        open={visibleAdvanced}
        centered
        width={840}
        footer={[]}
        onCancel={() => setVisibleAdvanced(false)}
      >
        <AdvancedSettings
          onConfirm={onConfirmAdvanced}
          initSettingData={setting}
        />
      </Modal>
    </>
  );
};
