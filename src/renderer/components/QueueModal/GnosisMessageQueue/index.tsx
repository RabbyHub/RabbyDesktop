import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { useGnosisNetworks } from '@/renderer/hooks/useGnosisNetworks';
import { useGnosisPendingMessages } from '@/renderer/hooks/useGnosisPendingMessages';
import { findChain } from '@/renderer/utils/chain';
import { SafeMessage } from '@safe-global/api-kit';
import classNames from 'classnames';
import clsx from 'clsx';
import { sortBy } from 'lodash';
import moment from 'moment';
import React, { useEffect, useMemo, useState } from 'react';
import { GnosisMessageQueueList } from './GnosisMessageQueueList';

const getTabs = (
  networks: string[],
  pendingMap: Record<string, SafeMessage[]>
) => {
  const res = networks
    ?.map((networkId) => {
      const chain = findChain({
        networkId,
      });
      if (!chain) {
        return;
      }
      const pendingTxs = pendingMap[chain?.network] || [];
      return {
        title: `${chain?.name} (${pendingTxs.length})`,
        key: chain.enum,
        chain,
        count: pendingTxs.length || 0,
        messages: pendingTxs,
      };
    })
    .filter((item) => !!item);
  return sortBy(
    res,
    (item) => -(item?.count || 0),
    (item) => {
      return -moment(item?.messages?.[0]?.created || 0).valueOf();
    }
  );
};
interface Props {
  onClose(): void;
}

export const GnosisMessageQueue: React.FC<Props> = ({ onClose }) => {
  const { currentAccount: account } = useCurrentAccount();
  const { data: networks } = useGnosisNetworks({ address: account?.address });
  const { data: pendingMessages, loading } = useGnosisPendingMessages(
    {
      address: account?.address,
    },
    {
      refreshOnWindowFocus: true,
    }
  );

  const tabs = useMemo(() => {
    return getTabs(
      networks || [],
      (pendingMessages?.results || []).reduce((res, item) => {
        res[item.networkId] = item.messages;
        return res;
      }, {} as Record<string, SafeMessage[]>)
    );
  }, [networks, pendingMessages]);

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
          <GnosisMessageQueueList
            key={activeKey}
            loading={loading}
            usefulChain={activeKey}
            messages={activeData?.messages || []}
          />
        )}
      </div>
    </section>
  );
};
