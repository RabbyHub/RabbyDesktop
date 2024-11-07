import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { findChain } from '@/renderer/utils/chain';
import { BasicSafeInfo } from '@rabby-wallet/gnosis-sdk';
import { SafeMessage } from '@safe-global/api-kit';
import { useRequest } from 'ahooks';
import classNames from 'classnames';
import React from 'react';
import { stringToHex } from 'web3-utils';
import { isString } from 'lodash';
import { RabbyButton } from '../../Button/RabbyButton';
import { GnosisMessageExplain } from './GnosisMessageExplain';
import { GnosisMessageQueueConfirmations } from './GnosisMessageQueueConfirmations';

export interface Props {
  data: SafeMessage;
  networkId: string;
  safeInfo: BasicSafeInfo;
  onSign(): void;
}

export const GnosisMessageQueueItem: React.FC<Props> = ({
  data,
  networkId,
  safeInfo,
  onSign,
}) => {
  const { currentAccount } = useCurrentAccount();
  const chain = findChain({
    networkId,
  });

  const { runAsync: handleView, loading } = useRequest(
    async () => {
      if (!currentAccount) {
        return;
      }
      await walletController.buildGnosisMessage({
        safeAddress: data.safe,
        account: currentAccount,
        version: safeInfo.version,
        networkId,
        message: data.message,
      });
      await Promise.all([
        data.confirmations.map((item) => {
          return walletController.addPureGnosisMessageSignature({
            signerAddress: item.owner,
            signature: item.signature,
          });
        }),
      ]);
      if (isString(data.message)) {
        await walletController.sendRequest({
          method: 'personal_sign',
          params: [stringToHex(data.message), data.safe],
          $ctx: {
            chainId: chain?.id,
            isViewGnosisSafe: true,
          },
        });
      } else {
        await walletController.sendRequest({
          method: 'eth_signTypedData_v4',
          params: [data.safe, JSON.stringify(data.message)],
          $ctx: {
            chainId: chain?.id,
            isViewGnosisSafe: true,
          },
        });
      }
      onSign?.();
    },
    {
      manual: true,
    }
  );

  return (
    <div
      className={classNames(
        'flex flex-col mb-[20px]',
        'border border-[#FFFFFF1A] border-solid rounded-[8px] text-white',
        'divide-y'
      )}
    >
      <div
        className={classNames(
          'flex p-[20px] gap-[10px]',
          'border-solid border-0 border-[#FFFFFF1A]'
        )}
      >
        <GnosisMessageExplain data={data} />
        <GnosisMessageQueueConfirmations
          confirmations={data.confirmations}
          threshold={safeInfo.threshold}
          owners={safeInfo.owners}
        />
        <div className="flex flex-col gap-[20px] justify-center flex-end">
          <RabbyButton
            className={classNames(
              'w-[172px] text-[13px] p-0 h-[34px] rounded-[4px]',
              'text-blue-light border-[#8697FF] bg-transparent border-solid'
            )}
            type="ghost"
            onClick={handleView}
            loading={loading}
          >
            {loading ? 'Loading...' : 'View and sign Message'}
          </RabbyButton>
        </div>
      </div>
    </div>
  );
};
