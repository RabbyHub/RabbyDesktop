import { findMaxGasTx } from '@/isomorphic/tx';
import { TransactionGroup } from '@/isomorphic/types/rabbyx';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { walletController, walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { findChain, findChainByID } from '@/renderer/utils/chain';
import { intToHex } from '@/renderer/utils/number';
import { CHAINS } from '@debank/common';
import { GasLevel } from '@rabby-wallet/rabby-api/dist/types';
import { useRequest } from 'ahooks';
import { flatten, maxBy } from 'lodash';
import styled from 'styled-components';

const IconWarning =
  'rabby-internal://assets/icons/signature-record/warning.svg';

const Wraper = styled.div`
  margin-bottom: 16px;

  .alert-detail {
    display: flex;
    align-items: start;
    padding: 8px 12px 8px 8px;
    border-radius: 6px;
    border: 0.5px solid var(--r-orange-default, #ffb020);
    border: 1px solid var(--r-orange-default, #ffb020);
    background: var(--r-orange-light, rgba(255, 176, 32, 0.15));
    gap: 6px;

    &:not(:last-child) {
      margin-bottom: 12px;
    }

    &-content {
      color: var(--r-neutral-title-1, #192945);
      font-size: 13px;
      font-weight: 400;
      line-height: 18px; /* 138.462% */

      .link {
        color: var(--r-blue-default, #7084ff);
        text-decoration-line: underline;
        cursor: pointer;
      }
    }
  }
`;

const AlertDetail = ({
  data,
  onSubmitTx,
}: {
  data: TransactionGroup;
  onSubmitTx?: (item: TransactionGroup) => void;
}) => {
  const chain = findChainByID(data.chainId);
  const nonce = data.nonce;
  const chainName = chain?.name || 'Unknown';

  return (
    <div className="alert-detail">
      <img src={IconWarning} alt="" />
      <div className="alert-detail-content">
        Nonce #{data.nonce} skipped on {chain?.name || 'Unknown'} chain. This
        may cause pending transactions ahead.{' '}
        <span
          className="link"
          onClick={() => {
            onSubmitTx?.(data);
          }}
        >
          Submit a tx
        </span>{' '}
        on chain to resolve
      </div>
    </div>
  );
};

export const SkipNonceAlert = ({
  pendings,
  reload,
}: {
  pendings: TransactionGroup[];
  reload?(): void;
}) => {
  const { currentAccount: account } = useCurrentAccount();
  const wallet = walletController;

  const { data } = useRequest(
    async () => {
      if (!account?.address || !pendings.length) {
        return;
      }
      const res = await wallet.getSkipedTxs(account?.address);
      return flatten(Object.values(res));
    },
    {
      refreshDeps: [account?.address, pendings],
    }
  );

  const handleOnChainCancel = async (item: TransactionGroup) => {
    // todo can cancel ?

    const maxGasTx = findMaxGasTx(item.txs)!;
    const maxGasPrice = Number(
      maxGasTx.rawTx.gasPrice || maxGasTx.rawTx.maxFeePerGas || 0
    );
    const chainServerId = findChain({
      id: item.chainId,
    })!.serverId;
    const gasLevels: GasLevel[] = await walletOpenapi.gasMarket(chainServerId);
    const maxGasMarketPrice = maxBy(gasLevels, (level) => level.price)!.price;
    await wallet.sendRequest({
      method: 'eth_sendTransaction',
      params: [
        {
          from: maxGasTx.rawTx.from,
          to: maxGasTx.rawTx.from,
          gasPrice: intToHex(Math.max(maxGasPrice * 2, maxGasMarketPrice)),
          value: '0x0',
          chainId: item.chainId,
          nonce: intToHex(item.nonce),
          isCancel: true,
          reqId: maxGasTx.reqId,
        },
      ],
    });
    reload?.();
  };

  if (!pendings.length || !data?.length) {
    return null;
  }

  return (
    <Wraper>
      {data?.map((item) => {
        return (
          <AlertDetail
            key={item.nonce}
            data={item}
            onSubmitTx={handleOnChainCancel}
          />
        );
      })}
    </Wraper>
  );
};
