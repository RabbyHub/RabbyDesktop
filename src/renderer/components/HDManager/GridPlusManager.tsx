/* eslint-disable react-hooks/exhaustive-deps */
import { Modal } from 'antd';
import React from 'react';
import { HARDWARE_KEYRING_TYPES } from '@/renderer/utils/constant';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import {
  AdvancedSettings,
  DEFAULT_SETTING_DATA,
  SettingData,
} from './AdvancedSettings';
import { HDPathType } from './HDPathTypeButton';
import { MainContainer } from './MainContainer';
import { fetchAccountsInfo, HDManagerStateContext, Account } from './utils';

export type InitAccounts = {
  [key in HDPathType]: Account[];
};

const GRIDPLUS_TYPE = HARDWARE_KEYRING_TYPES.GridPlus.type;

export const GridPlusManager: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const { getCurrentAccounts, createTask, keyringId } = React.useContext(
    HDManagerStateContext
  );
  const [visibleAdvanced, setVisibleAdvanced] = React.useState(false);
  const [setting, setSetting] =
    React.useState<SettingData>(DEFAULT_SETTING_DATA);
  const [initAccounts, setInitAccounts] = React.useState<InitAccounts>();

  const openAdvanced = React.useCallback(() => {
    if (loading) {
      return;
    }
    setVisibleAdvanced(true);
  }, [loading]);

  const changeHDPathTask = React.useCallback(async (type: HDPathType) => {
    await createTask(() =>
      walletController.requestKeyring(
        GRIDPLUS_TYPE,
        'setHDPathType',
        keyringId,
        type
      )
    );
  }, []);

  const onConfirmAdvanced = React.useCallback(async (data: SettingData) => {
    setVisibleAdvanced(false);
    setLoading(true);
    if (data.type) {
      await changeHDPathTask(data.type);
    }
    await createTask(() => getCurrentAccounts());
    setSetting(data);
    setLoading(false);
  }, []);

  const detectInitialHDPathType = React.useCallback(
    async (accounts: InitAccounts, usedHDPathType?: HDPathType) => {
      let initialHDPathType = usedHDPathType;

      if (!usedHDPathType) {
        initialHDPathType = HDPathType.LedgerLive;
        let maxUsedCount = 0;
        (Object.keys(accounts) as Array<keyof typeof HDPathType>).forEach(
          (key) => {
            const items = accounts[key] as Account[];
            const usedCount =
              items.filter((item) => !!item.chains?.length).length ?? 0;

            if (usedCount > maxUsedCount) {
              maxUsedCount = usedCount;
              initialHDPathType = key as HDPathType;
            }
          }
        );
      }

      await changeHDPathTask(initialHDPathType!);
      await createTask(() => getCurrentAccounts());
      setSetting((prev) => ({
        ...prev,
        type: initialHDPathType,
      }));

      return initialHDPathType;
    },
    []
  );

  const fetchInitAccountsTask = React.useCallback(async () => {
    setLoading(true);
    try {
      const accounts = (await createTask(() =>
        walletController.requestKeyring(
          GRIDPLUS_TYPE,
          'getInitialAccounts',
          keyringId
        )
      )) as InitAccounts;
      // fetch balance and transaction information
      (Object.keys(accounts) as Array<keyof typeof HDPathType>).forEach(
        async (key) => {
          key = key as HDPathType;
          const items = accounts[key] as Account[];
          accounts[key] = await fetchAccountsInfo(items);
        }
      );
      setInitAccounts(accounts);

      // fetch current used HDPathType
      const usedHDPathType =
        ((await createTask(() =>
          walletController.requestKeyring(
            GRIDPLUS_TYPE,
            'getCurrentUsedHDPathType',
            keyringId
          )
        )) as HDPathType) || undefined;

      detectInitialHDPathType(accounts, usedHDPathType);
    } catch (e) {
      console.error(e);
    }

    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchInitAccountsTask();
  }, []);
  const openSwitchHD = React.useCallback(async () => {
    Modal.error({
      title: 'Switch to a new GridPlus device',
      content: `It's not supported to import multiple GridPlus devices If you switch to a new GridPlus device, the current device's address list will be removed before starting the import process.`,
      okText: 'Confirm',
      onOk: async () => {
        const accounts = (await walletController.requestKeyring(
          GRIDPLUS_TYPE,
          'getAccounts',
          keyringId
        )) as string[];
        console.log(accounts);
        await Promise.all(
          accounts.map(async (account) =>
            walletController.removeAddress(
              account,
              GRIDPLUS_TYPE,
              undefined,
              true
            )
          )
        );
        await walletController.requestKeyring(
          GRIDPLUS_TYPE,
          'forgetDevice',
          keyringId
        );
        window.location.reload();
      },
      okCancel: false,
      centered: true,
      closable: true,
      maskClosable: true,
      className: 'hd-manager-switch-modal',
    });
  }, [keyringId]);

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-item" onClick={openSwitchHD}>
          <img
            className="icon"
            src="rabby-internal://assets/icons/hd-manager/device.svg"
          />
          <span className="title">Switch to another GridPlus</span>
        </div>
        <div className="toolbar-item" onClick={openAdvanced}>
          <img
            className="icon"
            src="rabby-internal://assets/icons/hd-manager/setting.svg"
          />
          <span className="title">Advanced Settings</span>
        </div>
      </div>

      <MainContainer setting={setting} loading={loading} HDName="GridPlus" />

      <Modal
        destroyOnClose
        className="AdvancedModal"
        title="Custom Address HD path"
        open={visibleAdvanced}
        centered
        width={840}
        footer={[]}
        onCancel={() => setVisibleAdvanced(false)}
      >
        <AdvancedSettings
          initAccounts={initAccounts}
          onConfirm={onConfirmAdvanced}
          initSettingData={setting}
        />
      </Modal>
    </>
  );
};
