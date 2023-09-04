import { Modal as RModal } from '@/renderer/components/Modal/Modal';
import PillsSwitch from '@/renderer/components/PillsSwitch';
import { Tabs } from 'antd';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import SignedTextHistory from './SignedTextHistory';
import styles from './index.module.less';
import { TransactionHistory } from './TransactionHistory';

const renderTabBar = () => <>{null}</>;

export const SignatureRecordModal = ({
  open,
  onCancel,
}: {
  open?: boolean;
  onCancel?: () => void;
}) => {
  const [selectedTab, onTabChange] = useState<'transactions' | 'texts'>(
    'transactions'
  );

  useEffect(() => {
    if (open) {
      onTabChange('transactions');
    }
  }, [open]);

  return (
    <RModal
      open={open}
      width={480}
      centered
      className={styles.ModalSupportedChains}
      onCancel={onCancel}
      title={
        <span className="text-r-neutral-title-1 text-20 font-medium">
          Signature Record
        </span>
      }
      destroyOnClose
    >
      <div className="sticky top-[0px] py-[20px] bg-r-neutral-bg-1 z-10">
        <PillsSwitch
          value={selectedTab}
          onTabChange={onTabChange}
          className="bg-r-neutral-line flex w-[232px] mx-[auto] my-0 h-[36px] p-[4px]"
          itemClassname={clsx(
            'rounded-0 w-[112px] py-[7px] text-[13px] font-medium'
          )}
          // @ts-expect-error
          style={{ '--active-bg': 'rgba(0, 0, 0, 0.20)' }}
          itemClassnameActive="bg-[var(--active-bg)] text-r-neutral-title-2"
          itemClassnameInActive="text-r-neutral-foot"
          options={
            [
              {
                key: 'transactions',
                label: `Transactions`,
              },
              {
                key: 'texts',
                label: `Texts`,
              },
            ] as const
          }
        />
      </div>
      <Tabs
        className="h-full max-h-[480px] overflowy-y-auto"
        renderTabBar={renderTabBar}
        activeKey={selectedTab}
      >
        <Tabs.TabPane key="transactions" destroyInactiveTabPane={false}>
          <TransactionHistory />
        </Tabs.TabPane>
        <Tabs.TabPane key="texts">
          <SignedTextHistory />
        </Tabs.TabPane>
      </Tabs>
    </RModal>
  );
};
