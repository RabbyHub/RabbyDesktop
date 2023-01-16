import React from 'react';
import { Modal } from 'antd';
import { HARDWARE_KEYRING_TYPES } from '@/renderer/utils/constant';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { MainContainer } from './MainContainer';
import {
  AdvancedSettings,
  SettingData,
  DEFAULT_SETTING_DATA,
  InitAccounts,
} from './AdvancedSettings';
import { HDPathType } from './HDPathTypeButton';
import { fetchAccountsInfo, HDManagerStateContext, Account } from './utils';

const LEDGER_TYPE = HARDWARE_KEYRING_TYPES.Ledger.type;

export const LedgerManager: React.FC = () => {
  const [visibleAdvanced, setVisibleAdvanced] = React.useState(false);
  const [setting, setSetting] =
    React.useState<SettingData>(DEFAULT_SETTING_DATA);
  const [initAccounts, setInitAccounts] = React.useState<InitAccounts>();
  const [loading, setLoading] = React.useState(false);
  const { getCurrentAccounts, createTask, keyringId } = React.useContext(
    HDManagerStateContext
  );

  const openAdvanced = React.useCallback(() => {
    if (loading) {
      return;
    }
    setVisibleAdvanced(true);
  }, [loading]);

  const changeHDPathTask = React.useCallback(async (type: HDPathType) => {
    await createTask(() =>
      walletController.requestKeyring(
        LEDGER_TYPE,
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
          LEDGER_TYPE,
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
            LEDGER_TYPE,
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

  return (
    <>
      <div className="setting" onClick={openAdvanced}>
        <img
          className="icon"
          src="rabby-internal://assets/icons/hd-manager/setting.svg"
        />
        <span className="title">Advanced Settings</span>
      </div>

      <MainContainer setting={setting} loading={loading} HDName="Ledger" />

      <Modal
        destroyOnClose
        className="AdvancedModal"
        title="Custom Address HD path"
        visible={visibleAdvanced}
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
