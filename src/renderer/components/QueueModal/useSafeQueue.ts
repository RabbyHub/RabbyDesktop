import { walletController } from '@/renderer/ipcRequest/rabbyx';
import Safe from '@rabby-wallet/gnosis-sdk';
import { SafeTransactionDataPartial } from '@gnosis.pm/safe-core-sdk-types';
import { numberToHex } from 'web3-utils';
import React from 'react';
import {
  SafeInfo,
  SafeTransactionItem,
} from '@rabby-wallet/gnosis-sdk/dist/api';
import dayjs from 'dayjs';
import { groupBy } from 'lodash';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { crossCompareOwners } from './util';

export const useSafeQueue = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [safeInfo, setSafeInfo] = React.useState<SafeInfo | null>(null);
  const [networkId, setNetworkId] = React.useState('1');
  const [transactionsGroup, setTransactionsGroup] = React.useState<
    Record<string, SafeTransactionItem[]>
  >({});
  const [isLoadFailed, setIsLoadFailed] = React.useState(false);
  const { currentAccount } = useCurrentAccount();

  const init = React.useCallback(async () => {
    const accountAddress = currentAccount!.address;
    try {
      const network = await walletController.getGnosisNetworkId(accountAddress);
      const [info, txs] = await Promise.all([
        Safe.getSafeInfo(accountAddress, network),
        Safe.getPendingTransactions(accountAddress, network),
      ]);
      const txHashValidation: boolean[] = [];
      for (let i = 0; i < txs.results.length; i++) {
        const safeTx = txs.results[i];
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
        // eslint-disable-next-line no-await-in-loop
        await walletController.buildGnosisTransaction(
          safeTx.safe,
          currentAccount!,
          tx
        );
        // eslint-disable-next-line no-await-in-loop
        const hash = await walletController.getGnosisTransactionHash();
        txHashValidation.push(hash === safeTx.safeTxHash);
      }
      const owners = await walletController.getGnosisOwners(
        currentAccount!,
        accountAddress,
        info.version
      );
      const comparedOwners = crossCompareOwners(info.owners, owners);
      setIsLoading(false);
      setSafeInfo({
        ...info,
        owners: comparedOwners,
      });
      setNetworkId(network);
      const transactions = txs.results
        .filter((safeTx, index) => {
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

          return safeTx.confirmations.every(async (confirm) =>
            walletController.validateSafeConfirmation(
              safeTx.safeTxHash,
              confirm.signature,
              confirm.owner,
              confirm.signatureType,
              info.version,
              info.address,
              tx,
              Number(network),
              comparedOwners
            )
          );
        })
        .sort((a, b) => {
          return dayjs(a.submissionDate).isAfter(dayjs(b.submissionDate))
            ? -1
            : 1;
        });

      setTransactionsGroup(groupBy(transactions, 'nonce'));
    } catch (e) {
      setIsLoading(false);
      setIsLoadFailed(true);
    }
  }, [currentAccount]);

  React.useEffect(() => {
    init();
  }, [init]);

  return {
    isLoading,
    safeInfo,
    networkId,
    transactionsGroup,
    isLoadFailed,
  };
};
