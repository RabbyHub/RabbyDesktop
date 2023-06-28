import classNames from 'classnames';
import React from 'react';
import { SafeTransactionItem } from '@rabby-wallet/gnosis-sdk/dist/api';
import { toChecksumAddress, numberToHex } from 'web3-utils';
import { intToHex } from 'ethereumjs-util';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { message } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { CHAINS } from '@debank/common';
import _ from 'lodash';
import { TxItemGroup } from './TxItemGroup';
import { useSafeQueue } from './useSafeQueue';
import styles from './style.module.less';
import { SelectAddressModal } from './SelectAddressModal';

interface Props {
  onClose(): void;
  usefulChain: CHAINS_ENUM;
  pendingTxs?: SafeTransactionItem[];
  loading?: boolean;
}

export const TxList: React.FC<Props> = ({
  onClose,
  usefulChain: chain,
  pendingTxs,
  loading,
}) => {
  const {
    transactionsGroup,
    networkId,
    safeInfo,
    isLoading: _isLoading,
  } = useSafeQueue({
    pendingTxs,
    networkId: CHAINS[chain].network,
  });
  const isLoading = _isLoading || loading;
  const [openSelectAddressModal, setOpenSelectAddressModal] =
    React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [safeTx, setSafeTx] = React.useState<SafeTransactionItem>();
  const { currentAccount } = useCurrentAccount();
  const currentAddress = currentAccount?.address;

  const handleSubmit = React.useCallback((data: SafeTransactionItem) => {
    setOpenSelectAddressModal(true);
    setSafeTx(data);
  }, []);

  const handleSign = React.useCallback(
    async (account: IDisplayedAccountWithBalance) => {
      if (!safeTx || !safeInfo) return;

      try {
        setSubmitting(true);
        const params = {
          chainId: Number(networkId),
          from: toChecksumAddress(safeTx.safe),
          to: safeTx.to,
          data: safeTx.data || '0x',
          value: numberToHex(safeTx.value),
          nonce: intToHex(safeTx.nonce),
          safeTxGas: safeTx.safeTxGas,
          gasPrice: Number(safeTx.gasPrice),
          baseGas: safeTx.baseGas,
        };
        await walletController.buildGnosisTransaction(
          currentAddress!,
          account,
          params,
          safeInfo?.version,
          networkId
        );
        await Promise.all(
          safeTx.confirmations.map((confirm) => {
            return walletController.gnosisAddPureSignature(
              confirm.owner,
              confirm.signature
            );
          })
        );
        await walletController.execGnosisTransaction(account);
        setSubmitting(false);
      } catch (e: any) {
        message.error(e.message || JSON.stringify(e));
        setSubmitting(false);
      }
      onClose();
      setOpenSelectAddressModal(false);
    },
    [currentAddress, networkId, onClose, safeInfo, safeTx]
  );

  const isEmpty = Object.keys(transactionsGroup).length === 0 && !isLoading;

  return (
    <section
      className={classNames(
        'flex flex-col gap-[20px] pb-[20px]',
        'h-[65vh] overflow-y-scroll',
        styles.scrollbar
      )}
    >
      {isEmpty && (
        <div className="text-[#FFFFFF66] items-center justify-center opacity-60 flex flex-col mt-[150px]">
          <img
            className="w-[95px] h-[95px]"
            src="rabby-internal://assets/icons/queue/empty.svg"
          />
          <div>No pending transactions</div>
        </div>
      )}
      {isLoading ? (
        <div className="text-[#FFFFFF66] items-center justify-center opacity-60 flex flex-col mt-[150px]">
          <LoadingOutlined
            style={{ fontSize: 50, marginBottom: '20px' }}
            spin
          />
          <div>Loading data...</div>
        </div>
      ) : (
        _.sortBy(Object.keys(transactionsGroup), (key) => {
          return -key;
        }).map((key) => (
          <TxItemGroup
            key={key}
            items={transactionsGroup[key]}
            networkId={networkId}
            safeInfo={safeInfo!}
            onSubmit={handleSubmit}
          />
        ))
      )}
      <SelectAddressModal
        open={openSelectAddressModal}
        onCancel={() => setOpenSelectAddressModal(false)}
        onConfirm={handleSign}
        networkId={networkId}
        submitting={submitting}
      />
    </section>
  );
};
