import classNames from 'classnames';
import React from 'react';
import { SafeTransactionItem } from '@rabby-wallet/gnosis-sdk/dist/api';
import { toChecksumAddress, numberToHex } from 'web3-utils';
import { intToHex } from 'ethereumjs-util';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { message } from 'antd';
import { TxItemGroup } from './TxItemGroup';
import { useSafeQueue } from './useSafeQueue';
import styles from './style.module.less';
import { TxItemGroupSkeleton } from './TxItemGroupSkeleton';
import { SelectAddressModal } from './SelectAddressModal';

interface Props {
  onClose(): void;
}

export const TxList: React.FC<Props> = ({ onClose }) => {
  const { transactionsGroup, networkId, safeInfo, isLoading } = useSafeQueue();
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
      if (!safeTx) return;

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
          params
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
        onClose();
      } catch (e: any) {
        message.error(e.message || JSON.stringify(e));
        setSubmitting(false);
      }
      setOpenSelectAddressModal(false);
    },
    [currentAddress, networkId, onClose, safeTx]
  );

  const isEmpty = Object.keys(transactionsGroup).length === 0 && !isLoading;

  return (
    <section
      className={classNames(
        'flex flex-col gap-[20px] px-[30px] pb-[20px]',
        'h-[70vh] overflow-y-scroll',
        styles.scrollbar
      )}
    >
      {isEmpty && (
        <div className="text-white text-center opacity-60">
          No pending transactions
        </div>
      )}
      {isLoading
        ? Array.from({ length: 3 }).map((_, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <TxItemGroupSkeleton key={index} />
          ))
        : Object.keys(transactionsGroup).map((key) => (
            <TxItemGroup
              key={key}
              items={transactionsGroup[key]}
              networkId={networkId}
              safeInfo={safeInfo!}
              onSubmit={handleSubmit}
            />
          ))}
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
