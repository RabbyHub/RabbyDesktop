import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Dropdown } from 'antd';
import { formatUsdValue } from '@/renderer/utils/number';
import { GasAccount } from '..';
import { useGasAccountInfo } from '../hooks';
import styles from '../index.module.less';
import { GasAccountInfo } from '../type';
import { GasAccountRefreshIdProvider } from '../hooks/context';

const GasAccountHeader = () => {
  const accountInfo: GasAccountInfo = useGasAccountInfo();
  const { value, loading } = accountInfo;

  const [visible, setVisible] = useState(false);
  const usd = useMemo(() => {
    if (loading) {
      return formatUsdValue(0);
    }
    if (value && 'account' in value) {
      return formatUsdValue(value.account.balance);
    }
    return formatUsdValue(0);
  }, [loading, value]);

  return (
    <Dropdown
      overlayClassName={clsx(
        'min-w-[400px]',
        !visible && 'h-0 overflow-hidden'
      )}
      overlay={<GasAccount setVisible={setVisible} accountInfo={accountInfo} />}
      open={visible}
      trigger={['click']}
      onOpenChange={(open) => {
        if (!open) {
          setVisible(false);
        }
      }}
      destroyPopupOnHide
    >
      <div
        onClick={() => {
          setVisible(true);
        }}
        className={clsx(
          'flex gap-2 items-center justify-center',
          'px-8 py-6 rounded-[6px]',
          'text-13 text-light-r-neutral-title-2',
          // 'text-opacity-60 hover:text-opacity-100',
          'bg-light-r-neutral-title-2 bg-opacity-10 hover:bg-opacity-20',
          styles.account
        )}
      >
        <img
          src="rabby-internal://assets/icons/gas-account/gas-account-cc.svg"
          className="w-[16px] h-[16px]"
        />
        <>{usd}</>
      </div>
    </Dropdown>
  );
};

export const GasAccountDashBoardHeader = () => {
  return (
    <GasAccountRefreshIdProvider>
      <GasAccountHeader />
    </GasAccountRefreshIdProvider>
  );
};
