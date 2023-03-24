import { openExternalUrl } from '@/renderer/ipcRequest/app';
import { getChain } from '@/renderer/utils';
import { ellipsis } from '@/renderer/utils/address';
import { sinceTime } from '@/renderer/utils/time';
import { TxDisplayItem, TxHistoryItem } from '@debank/rabby-api/dist/types';
import classNames from 'classnames';
import { useMemo } from 'react';
import styles from '../index.module.less';

interface TxBasicInfoProps {
  data: TxDisplayItem | TxHistoryItem;
}

export const TxBasicInfo = ({ data }: TxBasicInfoProps) => {
  const time = sinceTime(data.time_at);

  const chain = useMemo(() => getChain(data.chain), [data.chain]);
  const link = useMemo(
    () => chain?.scanLink.replace(/_s_/, data.id),
    [chain?.scanLink, data.id]
  );

  return (
    <div className={classNames(styles.txInfo)}>
      <div className={styles.txTime}>{time}</div>
      <div className={styles.txHash}>
        {chain?.name || 'Unknown'}:{' '}
        <a
          target="_blank"
          rel="noreferrer"
          href={`${link}`}
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
    </div>
  );
};
