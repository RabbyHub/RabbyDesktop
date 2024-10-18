import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer, message } from 'antd';
import { noop } from 'lodash';
import clsx from 'clsx';
import { useGasAccountMethods } from '../hooks';
import { GasACcountCurrentAddress } from './LoginPopup';
import {
  GasAccountBlueBorderedButton,
  GasAccountRedBorderedButton,
} from './Button';
import styles from '../index.module.less';
import { GasAccountInfo } from '../type';

const GasAccountLogoutContent = ({
  onClose,
  account,
}: {
  onClose: () => void;
  account?: GasAccountInfo['account'] | undefined;
}) => {
  const { t } = useTranslation();

  const { logout } = useGasAccountMethods();

  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      onClose();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      message.error(error?.message || String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-center items-center">
      <div className="text-20 font-medium text-r-neutral-title1 mt-20 mb-[24px]">
        {t('page.gasAccount.logoutConfirmModal.title')}
      </div>
      <GasACcountCurrentAddress account={account} />
      <div className="text-center text-14 text-r-neutral-body px-20">
        {t('page.gasAccount.logoutConfirmModal.desc')}
      </div>
      <div
        className={clsx(
          'flex items-center justify-center gap-16',
          'w-full mt-auto px-20 py-16 border-t-[0.5px] border-solid border-rabby-neutral-line border-0'
        )}
      >
        <GasAccountBlueBorderedButton onClick={onClose} block>
          {t('global.Cancel')}
        </GasAccountBlueBorderedButton>

        <GasAccountRedBorderedButton
          onClick={handleLogout}
          block
          loading={loading}
        >
          {t('page.gasAccount.logoutConfirmModal.logout')}
        </GasAccountRedBorderedButton>
      </div>
    </div>
  );
};

export const GasAccountLogoutPopup = (props: {
  onCancel: () => void;
  visible: boolean;
  account: GasAccountInfo['account'];
}) => {
  const { onCancel, visible, account } = props;

  return (
    <Drawer
      placement="bottom"
      getContainer={false}
      height={280}
      width={1}
      maskClosable
      closable={false}
      onClose={onCancel}
      bodyStyle={{
        padding: 0,
      }}
      className={styles.drawer}
      style={{
        overflow: 'hidden',
      }}
      maskStyle={{
        borderRadius: '12px',
      }}
      open={visible}
      destroyOnClose
    >
      <GasAccountLogoutContent account={account} onClose={onCancel || noop} />
    </Drawer>
  );
};
