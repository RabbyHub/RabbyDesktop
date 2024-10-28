import { Tx } from '@rabby-wallet/rabby-api/dist/types';
import BigNumber from 'bignumber.js';
import PQueue from 'p-queue';
import React from 'react';
import { AssetApprovalSpender } from '@/renderer/utils/approval';
import { ApprovalSpenderItemToBeRevoked } from '@/isomorphic/approve';
import { walletController } from '@/renderer/ipcRequest/rabbyx';

import { FailedCode, sendTransaction } from '@/renderer/utils/sendTransaction';
import { useShellWallet } from '@/renderer/hooks-shell/useShellWallet';
import { findIndexRevokeList } from '../../utils';

export { FailedCode } from '@/renderer/utils/sendTransaction';

async function buildTx(item: ApprovalSpenderItemToBeRevoked) {
  // generate tx
  let tx: Tx;
  if (item.permit2Id) {
    const data = await walletController.lockdownPermit2(
      {
        id: item.permit2Id,
        chainServerId: item.chainServerId,
        tokenSpenders: [
          {
            token: item.tokenId!,
            spender: item.spender,
          },
        ],
      },
      true
    );
    tx = data.params[0];
  } else if ('nftTokenId' in item) {
    const data = await walletController.revokeNFTApprove(item, undefined, true);
    tx = data.params[0];
  } else {
    const data = await walletController.approveToken(
      item.chainServerId,
      item.id,
      item.spender,
      0,
      {
        ga: {
          category: 'Security',
          source: 'tokenApproval',
        },
      },
      undefined,
      undefined,
      true
    );
    tx = data.params[0];
  }

  return tx;
}

export const FailReason = {
  [FailedCode.GasNotEnough]: 'Insufficient Gas to submit',
  [FailedCode.GasTooHigh]: 'Gas fee is high',
  [FailedCode.SubmitTxFailed]: 'Fail to Submit',
  [FailedCode.DefaultFailed]: 'Transaction failed',
};

export type AssetApprovalSpenderWithStatus = AssetApprovalSpender & {
  $status?:
    | {
        status: 'pending';
      }
    | {
        status: 'fail';
        failedCode: FailedCode;
        failedReason?: string;
        gasCost?: {
          gasCostUsd: BigNumber;
        };
      }
    | {
        status: 'success';
        txHash: string;
        gasCost: {
          gasCostUsd: BigNumber;
          gasCostAmount: BigNumber;
          nativeTokenSymbol: string;
        };
      };
};

const updateAssetApprovalSpender = (
  list: AssetApprovalSpender[],
  item: AssetApprovalSpender
) => {
  const index = list.findIndex((data) => {
    if (
      data.id === item.id &&
      data.$assetParent?.id === item.$assetParent?.id
    ) {
      return true;
    }
    return false;
  });

  if (index >= 0) {
    list[index] = item;
  }

  return [...list];
};

const cloneAssetApprovalSpender = (item: AssetApprovalSpender) => {
  const cloneItem: AssetApprovalSpenderWithStatus = {
    ...item,
    $status: {
      status: 'pending',
    },
  };
  const cloneProperty = (key: keyof AssetApprovalSpender) => {
    const descriptor = Object.getOwnPropertyDescriptor(item, key);
    if (descriptor) {
      Object.defineProperty(cloneItem, key, descriptor);
    }
  };

  cloneProperty('$assetContract');
  cloneProperty('$assetToken');
  cloneProperty('$assetParent');

  return cloneItem;
};

export const useBatchRevokeTask = () => {
  const queueRef = React.useRef(
    new PQueue({ concurrency: 1, autoStart: true })
  );
  const [list, setList] = React.useState<AssetApprovalSpenderWithStatus[]>([]);
  const [revokeList, setRevokeList] = React.useState<
    ApprovalSpenderItemToBeRevoked[]
  >([]);
  const [status, setStatus] = React.useState<
    'idle' | 'active' | 'paused' | 'completed'
  >('idle');
  const [txStatus, setTxStatus] = React.useState<'sended' | 'signed' | 'idle'>(
    'idle'
  );
  const currentApprovalRef = React.useRef<AssetApprovalSpender>();
  const shellWallet = useShellWallet();

  const addRevokeTask = React.useCallback(
    async (
      item: AssetApprovalSpender,
      priority = 0,
      ignoreGasCheck = false
    ) => {
      return queueRef.current.add(
        async () => {
          currentApprovalRef.current = item;
          const cloneItem = cloneAssetApprovalSpender(item);
          const revokeItem =
            revokeList[
              findIndexRevokeList(revokeList, {
                item: item.$assetContract!,
                spenderHost: item.$assetToken!,
                assetApprovalSpender: item,
              })
            ];

          cloneItem.$status!.status = 'pending';
          setList((prev) => updateAssetApprovalSpender(prev, cloneItem));

          try {
            const tx = await buildTx(revokeItem);
            const result = await sendTransaction({
              tx,
              ignoreGasCheck,
              chainServerId: revokeItem.chainServerId,
              onProgress: (s: string) => {
                if (s === 'builded') {
                  setTxStatus('sended');
                } else if (s === 'signed') {
                  setTxStatus('signed');
                }
              },
              shellWallet,
            });
            // update status
            cloneItem.$status = {
              status: 'success',
              txHash: result.txHash,
              gasCost: result.gasCost,
            };
          } catch (e: any) {
            let failedCode = FailedCode.DefaultFailed;
            if (Object.keys(FailedCode).includes(e.name)) {
              failedCode = e.name;
            }

            console.error(e);
            cloneItem.$status = {
              status: 'fail',
              failedCode,
              failedReason: e.message,
              gasCost: e.gasCost,
            };
          } finally {
            setList((prev) => updateAssetApprovalSpender(prev, cloneItem));
            setTxStatus('idle');
          }
        },
        { priority }
      );
    },
    [revokeList, shellWallet]
  );

  const start = React.useCallback(() => {
    setStatus('active');
    list.forEach((item) => {
      addRevokeTask(item);
    });
  }, [addRevokeTask, list]);

  const init = React.useCallback(
    (
      dataSource: AssetApprovalSpender[],
      revokeLists: ApprovalSpenderItemToBeRevoked[]
    ) => {
      queueRef.current.clear();
      setList(dataSource);
      setRevokeList(revokeLists);
      setStatus('idle');
    },
    []
  );

  const pause = React.useCallback(() => {
    queueRef.current.pause();
    setStatus('paused');
  }, []);

  const handleContinue = React.useCallback(() => {
    queueRef.current.start();
    setStatus('active');
  }, []);

  React.useEffect(() => {
    queueRef.current.on('error', (error) => {
      console.error('Queue error:', error);
    });

    queueRef.current.on('idle', () => {
      setStatus('completed');
    });

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      queueRef.current.clear();
    };
  }, []);

  const totalApprovals = React.useMemo(() => {
    return revokeList.length;
  }, [revokeList]);

  const revokedApprovals = React.useMemo(() => {
    return list.filter((item) => item.$status?.status === 'success').length;
  }, [list]);

  const currentApprovalIndex = React.useMemo(() => {
    return list.findIndex((item) => item.$status?.status === 'pending');
  }, [list]);

  return {
    list,
    init,
    start,
    continue: handleContinue,
    pause,
    status,
    txStatus,
    addRevokeTask,
    totalApprovals,
    revokedApprovals,
    currentApprovalIndex,
    currentApprovalRef,
  };
};

export type BatchRevokeTaskType = ReturnType<typeof useBatchRevokeTask>;
