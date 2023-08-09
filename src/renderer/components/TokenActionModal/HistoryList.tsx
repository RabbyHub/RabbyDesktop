import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { TokenItem, TxHistoryResult } from '@rabby-wallet/rabby-api/dist/types';
import { useInfiniteScroll } from 'ahooks';
import { last } from 'lodash';
import clsx from 'clsx';
import { HistoryItem } from './HistoryItem';
import styles from '../TransactionsModal/index.module.less';
import { HistoryItemSkeleton } from './HistoryItemSkeleton';

const PAGE_COUNT = 10;

interface Props {
  refContainer: React.MutableRefObject<HTMLDivElement | null>;
  token: TokenItem;
}

export const HistoryList: React.FC<Props> = ({ refContainer, token }) => {
  const { currentAccount } = useCurrentAccount();

  const fetchData = async (startTime = 0) => {
    const res: TxHistoryResult = await walletOpenapi.listTxHisotry({
      id: currentAccount!.address,
      chain_id: token?.chain,
      start_time: startTime,
      page_count: PAGE_COUNT,
      token_id: token?.id,
    });
    const { project_dict, cate_dict, token_dict, history_list: list } = res;
    const displayList = list
      .map((item) => ({
        ...item,
        projectDict: project_dict,
        cateDict: cate_dict,
        tokenDict: token_dict,
      }))
      .sort((v1, v2) => v2.time_at - v1.time_at);
    return {
      last: last(displayList)?.time_at,
      list: displayList,
    };
  };

  const { data, loading, loadingMore } = useInfiniteScroll(
    (d) => fetchData(d?.last),
    {
      target: refContainer,
      isNoMore: (d) => {
        return !d?.last || (d?.list.length || 0) < PAGE_COUNT;
      },
    }
  );

  return (
    <div
      ref={refContainer}
      className={clsx(
        styles.page,
        'h-full p-0 overflow-x-hidden mt-20 -mr-20 pr-20'
      )}
    >
      <div className={(styles.container, 'border-none space-y-[12px]')}>
        {loading &&
          Array.from({ length: 3 }).map(() => <HistoryItemSkeleton />)}
        {data?.list.map((item) => (
          <HistoryItem
            key={item.id}
            data={item}
            projectDict={item.projectDict}
            cateDict={item.cateDict}
            tokenDict={item.tokenDict}
          />
        ))}
        {loadingMore && <HistoryItemSkeleton />}
      </div>
    </div>
  );
};
