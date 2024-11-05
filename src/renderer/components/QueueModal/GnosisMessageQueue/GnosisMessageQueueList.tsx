import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { useGnosisSafeInfo } from '@/renderer/hooks/useGnosisSafeInfo';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { findChain } from '@/renderer/utils/chain';
import { LoadingOutlined } from '@ant-design/icons';
import { SafeMessage } from '@safe-global/api-kit';
import { useRequest } from 'ahooks';
import classNames from 'classnames';
import React from 'react';
import styles from '../style.module.less';
import { GnosisMessageQueueItem } from './GnosisMessageQueueItem';

interface Props {
  usefulChain: CHAINS_ENUM;
  messages?: SafeMessage[];
  loading?: boolean;
}

export const GnosisMessageQueueList: React.FC<Props> = ({
  usefulChain: chain,
  messages,
  loading,
}) => {
  const networkId =
    findChain({
      enum: chain,
    })?.network || '';

  const { currentAccount } = useCurrentAccount();
  const { data: safeInfo, loading: _isLoadingSafeInfo } = useGnosisSafeInfo({
    address: currentAccount?.address,
    networkId,
  });

  const { data: list, loading: _isLoading } = useRequest(
    async () => {
      if (!currentAccount?.address) {
        return;
      }
      const messageHashValidation = await Promise.all(
        (messages || []).map(async (item) => {
          return walletController.validateGnosisMessage(
            {
              address: currentAccount?.address,
              chainId: Number(networkId),
              message: item.message,
            },
            item.messageHash
          );
        })
      );

      const result = (messages || []).filter((item, index) => {
        if (!messageHashValidation[index]) {
          return false;
        }

        // todo
        // return item.confirmations.every((confirm) => {});

        return true;
      });
      return result;
    },
    {
      refreshDeps: [messages, currentAccount?.address],
    }
  );

  const isLoading = _isLoading || loading || _isLoadingSafeInfo;

  return (
    <section
      className={classNames(
        'flex flex-col gap-[20px] pb-[20px]',
        'h-[65vh] overflow-y-scroll',
        styles.scrollbar
      )}
    >
      {isLoading || !safeInfo ? (
        <div className="text-[#FFFFFF66] items-center justify-center opacity-60 flex flex-col mt-[150px]">
          <LoadingOutlined
            style={{ fontSize: 50, marginBottom: '20px' }}
            spin
          />
          <div>Loading data...</div>
        </div>
      ) : list?.length ? (
        <div>
          {list.map((item) => {
            return (
              <GnosisMessageQueueItem
                data={item}
                networkId={networkId}
                safeInfo={safeInfo}
                key={item.messageHash}
              />
            );
          })}
        </div>
      ) : (
        // Object.keys(transactionsGroup).map((key) => (
        //   <TxItemGroup
        //     key={key}
        //     items={transactionsGroup[key]}
        //     networkId={networkId}
        //     safeInfo={safeInfo!}
        //     // onSubmit={handleSubmit}
        //     onSign={onSign}
        //   />
        // ))
        <div className="text-[#FFFFFF66] items-center justify-center opacity-60 flex flex-col mt-[150px]">
          <img
            className="w-[95px] h-[95px]"
            src="rabby-internal://assets/icons/queue/empty.svg"
          />
          <div>No messages</div>
        </div>
      )}
    </section>
  );
};
