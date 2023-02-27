/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import useModal from 'antd/lib/modal/useModal';
import { useAsyncRetry } from 'react-use';
import {
  AdvancedSettings,
  DEFAULT_SETTING_DATA,
  SettingData,
} from './AdvancedSettings';
import { HDPathType } from './HDPathTypeButton';
import { MainContainer } from './MainContainer';
import { HDManagerStateContext, sleep } from './utils';
import { Modal } from '../Modal/Modal';

export interface Props {
  HDName?: string;
  onClose?: () => void;
}

export const TrezorManager: React.FC<Props> = ({
  HDName = 'Trezor',
  onClose,
}) => {
  const [loading, setLoading] = React.useState(true);
  const { getCurrentAccounts } = React.useContext(HDManagerStateContext);
  const [visibleAdvanced, setVisibleAdvanced] = React.useState(false);
  const [setting, setSetting] =
    React.useState<SettingData>(DEFAULT_SETTING_DATA);
  const [firstFetchAccounts, setFirstFetchAccounts] = React.useState(false);
  const [preventLoading, setPreventLoading] = React.useState(false);

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
  }, []);
  const fetchCurrentAccountsRetry = useAsyncRetry(fetchCurrentAccounts);

  const onConfirmAdvanced = React.useCallback(async (data: SettingData) => {
    setVisibleAdvanced(false);
    await fetchCurrentAccounts();
    setSetting({
      ...data,
      type: HDPathType.BIP44,
    });
  }, []);

  const [modal, contextHolder] = useModal();

  React.useEffect(() => {
    if (fetchCurrentAccountsRetry.loading) {
      return;
    }
    const errMessage = fetchCurrentAccountsRetry.error?.message ?? '';
    if (!errMessage) {
      setFirstFetchAccounts(true);
      return;
    }

    // connect failed because previous connect is not closed
    if (/Manifest not set/.test(errMessage)) {
      sleep(1000).then(fetchCurrentAccountsRetry.retry);
    } else {
      setPreventLoading(true);
      // modal.error({
      //   className: 'RabbyModal inherit',
      //   wrapClassName: 'p-20',
      //   content: (
      //     <div className="text-white">
      //       {`${HDName}Connect has stopped. Please retry to connect again.`}
      //     </div>
      //   ),
      //   okText: 'Retry',
      //   onOk() {
      //     onClose?.();
      //   },
      // });
      onClose?.();
    }
  }, [fetchCurrentAccountsRetry.loading, fetchCurrentAccountsRetry.error]);

  return (
    <>
      <div className="setting" onClick={openAdvanced}>
        <img
          className="icon"
          src="rabby-internal://assets/icons/hd-manager/setting.svg"
        />
        <span className="title">Advanced Settings</span>
      </div>

      <MainContainer
        firstFetchAccounts={firstFetchAccounts}
        setting={setting}
        loading={loading}
        HDName={HDName}
        preventLoading={preventLoading}
      />

      <Modal
        centered
        destroyOnClose
        className="AdvancedModal inherit"
        title="Custom Address HD path"
        open={visibleAdvanced}
        width={840}
        footer={[]}
        onCancel={() => setVisibleAdvanced(false)}
      >
        <AdvancedSettings
          onConfirm={onConfirmAdvanced}
          initSettingData={setting}
        />
      </Modal>
      {contextHolder}
    </>
  );
};
