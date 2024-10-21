import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, message, Drawer } from 'antd';
import { noop } from 'lodash';
import clsx from 'clsx';
import { formatUsdValue } from '@/renderer/utils/number';
import { openExternalUrl } from '@/renderer/ipcRequest/app';
import { walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { useGasAccountRefresh, useGasAccountSign } from '../hooks';
import { GasACcountCurrentAddress } from './LoginPopup';
import { GasAccountCloseIcon } from './PopupCloseIcon';
import styles from '../index.module.less';
import { GasAccountInfo } from '../type';

const WithdrawContent = ({
  balance,
  onClose,
  onAfterConfirm,
  account,
}: {
  account: GasAccountInfo['account'];
  balance: number;
  onClose: () => void;
  onAfterConfirm?: () => void;
}) => {
  const { t } = useTranslation();

  const { sig, accountId } = useGasAccountSign();

  const [loading, setLoading] = useState(false);

  const { refresh } = useGasAccountRefresh();

  const withdraw = async () => {
    if (balance <= 0) {
      onClose();
      onAfterConfirm?.();
      return;
    }
    try {
      setLoading(true);
      await walletOpenapi.withdrawGasAccount({
        sig: sig || '',
        account_id: accountId || '',
        amount: balance,
      });
      setTimeout(() => {
        refresh();
      }, 200);
      onClose();
      onAfterConfirm?.();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      message.error(error?.message || String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-center items-center relative">
      <GasAccountCloseIcon
        className="absolute right-16 top-20 cursor-pointer"
        onClick={onClose}
      />
      <div className="text-20 font-medium text-r-neutral-title1 mt-20 mb-[12px]">
        {t('page.gasAccount.withdrawPopup.title')}
      </div>
      <div className="text-center text-14 text-r-neutral-body px-10">
        {t('page.gasAccount.withdrawPopup.desc')}
      </div>

      <div className="w-full px-20">
        <div className="text-13 text-r-neutral-body mt-12 mb-8">
          {t('page.gasAccount.withdrawPopup.amount')}
        </div>
        <div className="h-[48px] pl-16 flex items-center text-15 font-medium text-r-neutral-title1 rounded-md bg-r-neutral-card2">
          {formatUsdValue(balance)}
        </div>
        <div className="text-13 text-r-neutral-body mt-12 mb-8">
          {t('page.gasAccount.withdrawPopup.to')}
        </div>

        <GasACcountCurrentAddress account={account} />
      </div>

      <div
        className={clsx(
          'flex items-center justify-center gap-16',
          'w-full mt-auto px-20 py-16 border-t-[0.5px] border-solid border-rabby-neutral-line border-0'
        )}
      >
        <Button
          type="primary"
          className="h-[48px] text-15 font-medium text-r-neutral-title-2 rounded-[6px]"
          onClick={withdraw}
          block
          loading={loading}
        >
          {t('global.confirm')}
        </Button>
      </div>
    </div>
  );
};

const WithdrawConfirmContent = ({
  onClose,
  account,
}: {
  onClose: () => void;
  account: GasAccountInfo['account'];
}) => {
  const { t } = useTranslation();

  const gotoDeBankL2 = async () => {
    openExternalUrl('https://debank.com/account');
  };

  return (
    <div className="w-full h-full flex flex-col justify-center items-center relative">
      <GasAccountCloseIcon
        className="absolute right-16 top-20 cursor-pointer"
        onClick={onClose}
      />
      <img
        className="w-[32px] w-[32px] mt-[34px]"
        src="rabby-internal://assets/icons/gas-account/confirm.svg"
      />
      <div className="text-[18px] font-medium text-r-green-default mt-12 mb-[16px]">
        {t('page.gasAccount.withdrawConfirmModal.title')}
      </div>

      <div className="mb-8">
        <GasACcountCurrentAddress account={account} />
      </div>

      <div
        className={clsx(
          'flex items-center justify-center gap-16',
          'w-full mt-auto px-20 py-16 border-t-[0.5px] border-solid border-rabby-neutral-line border-0'
        )}
      >
        <div
          className="w-full flex items-center justify-center gap-4 cursor-pointer h-[48px] text-15 font-medium text-r-neutral-title-2 bg-[#FF7C60] rounded-md"
          onClick={gotoDeBankL2}
        >
          <span>{t('page.gasAccount.withdrawConfirmModal.button')}</span>
          <img
            src="rabby-internal://assets/icons/gas-account/IconOpenExtrenalWhite.svg"
            className="w-14 h-14 text-r-neutral-title2"
          />
        </div>
      </div>
    </div>
  );
};

export const WithdrawConfirmPopup = (props: {
  visible: boolean;
  account: GasAccountInfo['account'];
  onCancel: () => void;
}) => {
  const { visible, account, onCancel } = props;

  return (
    <>
      <Drawer
        placement="bottom"
        getContainer={false}
        height="min-content"
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
        push={false}
        maskStyle={{
          borderRadius: '12px',
        }}
        open={visible}
        destroyOnClose
        {...props}
      >
        <WithdrawConfirmContent account={account} onClose={onCancel || noop} />
      </Drawer>
    </>
  );
};

export const WithdrawPopup = (props: {
  balance: number;
  onCancel: () => void;
  account: GasAccountInfo['account'];
  visible: boolean;
}) => {
  const [visible, setVisible] = useState(false);
  const { onCancel, account, visible: withdrawVisible, balance } = props;
  return (
    <>
      <Drawer
        placement="bottom"
        getContainer={false}
        height="min-content"
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
        push={false}
        maskStyle={{
          borderRadius: '12px',
        }}
        open={withdrawVisible}
        destroyOnClose
        {...props}
      >
        <WithdrawContent
          account={account}
          onClose={onCancel || noop}
          balance={balance}
          onAfterConfirm={() => setVisible(true)}
        />
      </Drawer>
      <WithdrawConfirmPopup
        account={account}
        visible={visible}
        onCancel={() => setVisible(false)}
      />
    </>
  );
};
