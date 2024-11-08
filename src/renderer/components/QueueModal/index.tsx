import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { useGnosisPendingMessages } from '@/renderer/hooks/useGnosisPendingMessages';
import { useGnosisPendingTxs } from '@/renderer/hooks/useGnosisPendingTxs';
import { useZPopupViewState } from '@/renderer/hooks/usePopupWinOnMainwin';
import { useSyncGnosisNetworks } from '@/renderer/hooks/useSyncGnosisNetworks';
import { Tabs } from 'antd';
import { sum } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { createGlobalStyle } from 'styled-components';
import { Modal } from '../Modal/Modal';
import PillsSwitch from '../PillsSwitch';
import { GnosisMessageQueue } from './GnosisMessageQueue';
import { GnosisTransactionQueue } from './GnosisTransactionQueue';
import styles from './style.module.less';

const GlobalStyle = createGlobalStyle`
    .x-ant-tabs {
      .ant-tabs-nav {
        display: none;
      }
    }
  `;

export const QueueModal: React.FC = () => {
  const { svVisible, closeSubview } = useZPopupViewState('safe-queue-modal');

  const { currentAccount: account } = useCurrentAccount();

  const { data: pendingTxs } = useGnosisPendingTxs(
    {
      address: account?.address,
    },
    {
      refreshOnWindowFocus: true,
    }
  );

  const { data: messages } = useGnosisPendingMessages(
    {
      address: account?.address,
    },
    {
      refreshOnWindowFocus: true,
    }
  );

  const tabs = useMemo(() => {
    return [
      {
        label: `Transaction (${pendingTxs?.total || 0})`,
        key: 'transaction' as const,
      },
      {
        label: `Message (${messages?.total || 0})`,
        key: 'message' as const,
      },
    ];
  }, [pendingTxs?.total, messages?.total]);

  const [activeKey, setActiveKey] = useState<'transaction' | 'message'>(
    tabs[0]?.key
  );

  const total = useMemo(() => {
    return sum([pendingTxs?.total, messages?.total].map((item) => item || 0));
  }, [pendingTxs?.total, messages?.total]);

  useSyncGnosisNetworks(account?.address);

  useEffect(() => {
    if (!svVisible) {
      setActiveKey('transaction');
    }
  }, [svVisible]);

  if (!svVisible) return null;

  return (
    <Modal
      width={1000}
      onCancel={closeSubview}
      open={svVisible}
      centered
      className={styles.modal}
      title={`Queue(${total || 0})`}
    >
      <GlobalStyle />
      <div className="flex items-center justify-center mb-[24px]">
        <PillsSwitch
          className="p-[2px] h-[36px] bg-r-neutral-line"
          itemClassname="p-[7px] w-[140px]"
          itemClassnameActive="text-r-neutral-title2 bg-r-neutral-bg1"
          itemClassnameInActive="text-r-neutral-body"
          options={tabs}
          value={activeKey}
          onTabChange={setActiveKey}
        />
      </div>
      <Tabs
        activeKey={activeKey}
        onChange={(v: any) => setActiveKey(v)}
        className="x-ant-tabs"
      >
        <Tabs.TabPane key="transaction">
          <GnosisTransactionQueue onClose={closeSubview} />
        </Tabs.TabPane>
        <Tabs.TabPane key="message">
          <GnosisMessageQueue onClose={closeSubview} />
        </Tabs.TabPane>
      </Tabs>
    </Modal>
  );
};
