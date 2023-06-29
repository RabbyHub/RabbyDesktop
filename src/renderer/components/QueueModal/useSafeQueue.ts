import { walletController } from '@/renderer/ipcRequest/rabbyx';
import Safe from '@rabby-wallet/gnosis-sdk';
import { SafeTransactionDataPartial } from '@gnosis.pm/safe-core-sdk-types';
import { numberToHex } from 'web3-utils';
import React, { useCallback, useEffect } from 'react';
import {
  SafeInfo,
  SafeTransactionItem,
} from '@rabby-wallet/gnosis-sdk/dist/api';
import dayjs from 'dayjs';
import { groupBy } from 'lodash';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { useGnosisSafeInfo } from '@/renderer/hooks/useGnosisSafeInfo';
import { crossCompareOwners } from './util';

export const useSafeQueue = ({
  pendingTxs,
  networkId,
}: {
  pendingTxs?: SafeTransactionItem[];
  networkId: string;
}) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [transactionsGroup, setTransactionsGroup] = React.useState<
    Record<string, SafeTransactionItem[]>
  >({});
  const [isLoadFailed, setIsLoadFailed] = React.useState(false);
  const { currentAccount } = useCurrentAccount();
  const { data: safeInfo } = useGnosisSafeInfo({
    address: currentAccount?.address,
    networkId,
  });

  const init = useCallback(
    async (txs: SafeTransactionItem[], info: SafeInfo) => {
      if (!currentAccount) {
        return;
      }
      const account = currentAccount;
      try {
        const txHashValidation = await Promise.all(
          txs.map(async (safeTx) => {
            const tx: SafeTransactionDataPartial = {
              data: safeTx.data || '0x',
              gasPrice: safeTx.gasPrice ? Number(safeTx.gasPrice) : 0,
              gasToken: safeTx.gasToken,
              refundReceiver: safeTx.refundReceiver,
              to: safeTx.to,
              value: numberToHex(safeTx.value),
              safeTxGas: safeTx.safeTxGas,
              nonce: safeTx.nonce,
              operation: safeTx.operation,
              baseGas: safeTx.baseGas,
            };
            return walletController.validateGnosisTransaction(
              {
                account,
                tx,
                version: info.version,
                networkId,
              },
              safeTx.safeTxHash
            );
          })
        );

        const owners = await walletController.getGnosisOwners(
          account,
          account.address,
          info.version,
          networkId
        );
        const comparedOwners = crossCompareOwners(info.owners, owners);
        setIsLoading(false);

        // const transactions
        const validateRes = await Promise.all(
          txs.map((safeTx, index) => {
            if (!txHashValidation[index]) return false;
            const tx: SafeTransactionDataPartial = {
              data: safeTx.data || '0x',
              gasPrice: safeTx.gasPrice ? Number(safeTx.gasPrice) : 0,
              gasToken: safeTx.gasToken,
              refundReceiver: safeTx.refundReceiver,
              to: safeTx.to,
              value: numberToHex(safeTx.value),
              safeTxGas: safeTx.safeTxGas,
              nonce: safeTx.nonce,
              operation: safeTx.operation,
              baseGas: safeTx.baseGas,
            };

            const res = safeTx.confirmations.map(async (confirm) =>
              walletController.validateSafeConfirmation(
                safeTx.safeTxHash,
                confirm.signature,
                confirm.owner,
                confirm.signatureType,
                info.version,
                info.address,
                tx,
                Number(networkId),
                comparedOwners
              )
            );
            return Promise.all(res).then((data) => {
              return data.every((item) => item);
            });
          })
        );

        const transactions = txs
          .filter((_, index) => validateRes[index])
          .sort((a, b) => {
            return dayjs(a.submissionDate).isAfter(dayjs(b.submissionDate))
              ? -1
              : 1;
          });

        setTransactionsGroup(groupBy(transactions, 'nonce'));
      } catch (e) {
        console.error(e);
        setIsLoading(false);
        setIsLoadFailed(true);
      }
    },
    [currentAccount, networkId]
  );

  // React.useEffect(() => {
  //   init(txs);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [currentAccount?.address]);

  useEffect(() => {
    if (pendingTxs && safeInfo) {
      init(pendingTxs || [], safeInfo);
    }
  }, [init, pendingTxs, safeInfo]);

  return {
    isLoading,
    safeInfo,
    networkId,
    transactionsGroup,
    isLoadFailed,
  };
};
