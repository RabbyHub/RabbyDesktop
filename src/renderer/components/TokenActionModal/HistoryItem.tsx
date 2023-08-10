import { openExternalUrl } from '@/renderer/ipcRequest/app';
import { getChain } from '@/renderer/utils';
import { ellipsis } from '@/renderer/utils/address';
import { sinceTime } from '@/renderer/utils/time';
import {
  TxDisplayItem,
  TxHistoryItem,
} from '@rabby-wallet/rabby-api/dist/types';
import clsx from 'clsx';
import { useMemo } from 'react';
import { TxInterAddressExplain } from '../TransactionsModal/components/TxInterAddressExplain';
// eslint-disable-next-line import/no-cycle
import { TxChange } from '../TransactionsModal/components/TxChange';
import styles from '../TransactionsModal/index.module.less';

type Props = {
  data: TxDisplayItem | TxHistoryItem;
} & Pick<TxDisplayItem, 'cateDict' | 'projectDict' | 'tokenDict'>;

export const HistoryItem: React.FC<Props> = ({
  data,
  cateDict,
  projectDict,
  tokenDict,
}) => {
  const isFailed = data.tx?.status === 0;
  const isScam = data.is_scam;

  const chain = useMemo(() => getChain(data.chain), [data.chain]);
  const link = useMemo(
    () => chain?.scanLink.replace(/_s_/, data.id),
    [chain?.scanLink, data.id]
  );

  return (
    <div
      className={clsx(
        styles.tx,
        (isFailed || isScam) && styles.txGray,
        styles.tokenDetail,
        'flex flex-col overflow-hidden',
        'border border-solid rounded-[6px] border-[#FFFFFF1A]',
        'p-[12px]'
      )}
    >
      <div className={styles.badge}>
        {isScam && <div className={styles.tag}>Scam tx</div>}

        {isFailed && (
          <div className={clsx(styles.tag, styles.tagFailed)}>
            <img
              src="rabby-internal://assets/icons/transaction/info.svg"
              alt=""
            />
            Failed
          </div>
        )}
      </div>
      <div
        className={clsx(
          styles.txHeader,
          'flex justify-between w-full',
          'text-[#BABEC5] text-12',
          'mb-12'
        )}
      >
        <div>{sinceTime(data.time_at)}</div>
        <a
          target="_blank"
          rel="noreferrer"
          href={`${link}`}
          className="text-[#BABEC5] underline"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (link) {
              openExternalUrl(link);
            }
          }}
        >
          {ellipsis(data.id)}
        </a>
      </div>
      <div className="flex overflow-hidden w-full">
        <TxInterAddressExplain
          data={data}
          cateDict={cateDict}
          projectDict={projectDict}
          tokenDict={tokenDict}
        />
        <TxChange data={data} tokenDict={tokenDict} />
      </div>
    </div>
  );
};
