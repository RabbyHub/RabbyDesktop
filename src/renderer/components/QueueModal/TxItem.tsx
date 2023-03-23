import { RabbyAccount } from '@/isomorphic/types/rabbyx';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { walletController, walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import {
  INTERNAL_REQUEST_ORIGIN,
  KEYRING_CLASS,
} from '@/renderer/utils/constant';
import { ExplainTxResponse } from '@debank/rabby-api/dist/types';
import {
  SafeInfo,
  SafeTransactionItem,
} from '@rabby-wallet/gnosis-sdk/dist/api';
import { Button } from 'antd';
import classNames from 'classnames';
import { intToHex, toChecksumAddress } from 'ethereumjs-util';
import React from 'react';
import { TxItemBasicInfo } from './TxItemBasicInfo';
import { TxItemConfirmation } from './TxItemConfirmation';
import { TxItemExplain } from './TxitemExplain';

export interface Props {
  data: SafeTransactionItem;
  networkId: string;
  safeInfo: SafeInfo;
  onSubmit(data: SafeTransactionItem): void;
}

export const TxItem: React.FC<Props> = ({
  data,
  networkId,
  safeInfo,
  onSubmit,
}) => {
  const [explain, setExplain] = React.useState<ExplainTxResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { currentAccount } = useCurrentAccount();
  const canExecute =
    data.confirmations.length >= safeInfo.threshold &&
    data.nonce === safeInfo.nonce;

  const init = React.useCallback(async () => {
    const res = await walletOpenapi.preExecTx({
      tx: {
        chainId: Number(networkId),
        from: data.safe,
        to: data.to,
        data: data.data || '0x',
        value: `0x${Number(data.value).toString(16)}`,
        nonce: intToHex(data.nonce),
        gasPrice: '0x0',
        gas: '0x0',
      },
      origin: INTERNAL_REQUEST_ORIGIN,
      address: data.safe,
      updateNonce: false,
      pending_tx_list: [],
    });
    setExplain(res);
  }, [data, networkId]);

  const handleView = async () => {
    setIsLoading(true);
    const params = {
      chainId: Number(networkId),
      from: toChecksumAddress(data.safe),
      to: data.to,
      data: data.data || '0x',
      value: `0x${Number(data.value).toString(16)}`,
      nonce: intToHex(data.nonce),
      safeTxGas: data.safeTxGas,
      gasPrice: Number(data.gasPrice),
      baseGas: data.baseGas,
    };
    const tmpBuildAccount: RabbyAccount = {
      address: safeInfo.owners[0],
      type: KEYRING_CLASS.WATCH,
      brandName: KEYRING_CLASS.WATCH,
    };
    await walletController.buildGnosisTransaction(
      currentAccount!.address,
      tmpBuildAccount,
      params
    );
    await walletController.setGnosisTransactionHash(data.safeTxHash);
    await Promise.all(
      data.confirmations.map((confirm) => {
        return walletController.gnosisAddPureSignature(
          confirm.owner,
          confirm.signature
        );
      })
    );
    setIsLoading(false);
    walletController.sendRequest({
      method: 'eth_sendTransaction',
      params: [
        {
          ...params,
          isViewGnosisSafe: true,
        },
      ],
    });
  };

  React.useEffect(() => {
    init();
  }, [init]);

  return (
    <div
      className={classNames(
        'flex p-[20px] gap-[10px]',
        'border-solid border-0 border-[#FFFFFF1A]'
      )}
    >
      <TxItemBasicInfo timeAt={data.submissionDate} nonce={data.nonce} />
      <TxItemExplain explain={explain!} />
      <TxItemConfirmation
        confirmations={data.confirmations}
        threshold={safeInfo.threshold}
        owners={safeInfo.owners}
      />

      <div className="flex flex-col gap-[20px] justify-center flex-end">
        <Button
          className={classNames(
            'w-[172px] text-[13px] p-0 h-[34px] rounded-[4px]',
            'text-blue-light border-blue-light'
          )}
          type="ghost"
          onClick={handleView}
          loading={isLoading}
        >
          {isLoading ? 'Loading...' : 'View and sign transaction'}
        </Button>
        <Button
          onClick={() => onSubmit(data)}
          prefixCls="rabby-button"
          disabled={!canExecute}
          className={classNames(
            'w-[172px] text-[13px] h-[34px] rounded-[4px]',
            'bg-color-[#8697FF] outline-none border-none cursor-pointer shadow',
            {
              'opacity-30 cursor-not-allowed': !canExecute,
            }
          )}
          type="primary"
        >
          Submit transaction
        </Button>
      </div>
    </div>
  );
};
