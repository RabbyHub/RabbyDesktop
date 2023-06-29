import { RabbyAccount } from '@/isomorphic/types/rabbyx';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { walletController, walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import {
  INTERNAL_REQUEST_ORIGIN,
  KEYRING_CLASS,
} from '@/renderer/utils/constant';
import { ExplainTxResponse } from '@rabby-wallet/rabby-api/dist/types';
import {
  SafeInfo,
  SafeTransactionItem,
} from '@rabby-wallet/gnosis-sdk/dist/api';
import classNames from 'classnames';
import { intToHex } from 'ethereumjs-util';
import React from 'react';
import { toChecksumAddress } from 'web3-utils';
import { RabbyButton } from '../Button/RabbyButton';
import { TxItemBasicInfo } from './TxItemBasicInfo';
import { TxItemConfirmation } from './TxItemConfirmation';
import { TxItemExplain } from './TxitemExplain';

export interface Props {
  data: SafeTransactionItem;
  networkId: string;
  safeInfo: SafeInfo;
  onSubmit(data: SafeTransactionItem): void;
  onSign(data: SafeTransactionItem): void;
}

export const TxItem: React.FC<Props> = ({
  data,
  networkId,
  safeInfo,
  onSubmit,
  onSign,
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
      params,
      safeInfo.version,
      networkId
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
    await walletController.sendRequest({
      method: 'eth_sendTransaction',
      params: [
        {
          ...params,
          isViewGnosisSafe: true,
        },
      ],
    });
    onSign(data);
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
        <RabbyButton
          className={classNames(
            'w-[172px] text-[13px] p-0 h-[34px] rounded-[4px]',
            'text-blue-light border-[#8697FF] bg-transparent border-solid'
          )}
          type="ghost"
          onClick={handleView}
          loading={isLoading}
        >
          {isLoading ? 'Loading...' : 'View and sign transaction'}
        </RabbyButton>
        <RabbyButton
          onClick={() => onSubmit(data)}
          prefixCls="rabby-button"
          disabled={!canExecute}
        >
          Submit transaction
        </RabbyButton>
      </div>
    </div>
  );
};
