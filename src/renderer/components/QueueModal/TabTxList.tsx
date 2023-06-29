import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import { SafeTransactionItem } from '@rabby-wallet/gnosis-sdk/dist/api';
import { toChecksumAddress, numberToHex } from 'web3-utils';
import { intToHex } from 'ethereumjs-util';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { message } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useGnosisNetworks } from '@/renderer/hooks/useGnosisNetworks';
import { useGnosisPendingTxs } from '@/renderer/hooks/useGnosisPendingTxs';
import { CHAINS } from '@debank/common';
import { sortBy } from 'lodash';
import moment from 'moment';
import clsx from 'clsx';
import { SelectAddressModal } from './SelectAddressModal';
import styles from './style.module.less';
import { useSafeQueue } from './useSafeQueue';
import { TxItemGroup } from './TxItemGroup';
import { TxList } from './TxList';

const getTabs = (
  networks: string[],
  pendingMap: Record<string, SafeTransactionItem[]>
) => {
  const res = networks
    ?.map((networkId) => {
      const chain = Object.values(CHAINS).find(
        (ch) => ch.network === networkId
      );
      if (!chain) {
        return;
      }
      const pendingTxs = pendingMap[chain?.network] || [];
      return {
        title: `${chain?.name} (${pendingTxs.length})`,
        key: chain.enum,
        chain,
        count: pendingTxs.length || 0,
        txs: pendingTxs,
      };
    })
    .filter((item) => !!item);
  return sortBy(
    res,
    (item) => -(item?.count || 0),
    (item) => {
      return -moment(item?.txs?.[0]?.submissionDate || 0).valueOf();
    }
  );
};

interface Props {
  onClose(): void;
}

export const TabTxList: React.FC<Props> = ({ onClose }) => {
  const { currentAccount: account } = useCurrentAccount();
  const { data: networks } = useGnosisNetworks({ address: account?.address });
  const {
    data: pendingTxs,
    loading,
    runAsync: fetchPendingTxs,
  } = useGnosisPendingTxs({
    address: account?.address,
  });

  const tabs = useMemo(() => {
    return getTabs(
      networks || [],
      (pendingTxs?.results || []).reduce((res, item) => {
        res[item.networkId] = item.txs;
        return res;
      }, {} as Record<string, SafeTransactionItem[]>)
    );
  }, [networks, pendingTxs]);

  const [activeKey, setActiveKey] = useState<CHAINS_ENUM | null>(
    tabs[0]?.key || null
  );

  const activeData = useMemo(() => {
    return tabs.find((item) => item?.chain?.enum === activeKey);
  }, [tabs, activeKey]);

  const firstTab = tabs[0]?.key;

  useEffect(() => {
    setActiveKey(firstTab || null);
  }, [firstTab]);

  return (
    <section
      className={classNames('flex flex-col gap-[20px] px-[30px] pb-[20px]')}
    >
      <div className="flex flex-wrap items-center gap-x-[16px] gap-y-[8px] sticky top-0">
        {tabs?.map((tab) => {
          return (
            <div
              className={clsx(
                'pt-[6px] py-[4px]  text-[14px] cursor-pointer border-0 border-b-2  border-solid',
                activeKey === tab?.key
                  ? 'border-[#8697FF] text-[#8697FF]'
                  : 'border-transparent text-white'
              )}
              onClick={() => {
                setActiveKey(tab?.key || null);
              }}
              key={tab?.key}
            >
              {tab?.title}
            </div>
          );
        })}
      </div>
      <div>
        {activeKey && (
          <TxList
            onClose={onClose}
            key={activeKey}
            loading={loading}
            usefulChain={activeKey}
            pendingTxs={activeData?.txs || []}
            onSign={fetchPendingTxs}
          />
        )}
      </div>
    </section>
  );
};
