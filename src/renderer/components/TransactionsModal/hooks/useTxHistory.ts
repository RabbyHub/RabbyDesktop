import { walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { useInfiniteScroll } from 'ahooks';
import { last } from 'lodash';

const PAGE_COUNT = 20;

const fetchData = async ({
  id,
  start_time = 0,
}: Parameters<typeof walletOpenapi.listTxHisotry>[0]) => {
  const res = await walletOpenapi.listTxHisotry({
    id,
    start_time,
    page_count: PAGE_COUNT,
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

export const useTxHistory = (
  address: string,
  target: NonNullable<Parameters<typeof useInfiniteScroll>[1]>['target']
) => {
  return useInfiniteScroll(
    (d) => fetchData({ id: address, start_time: d?.last }),
    {
      target,
      isNoMore: (d) => {
        return !d?.last || (d?.list.length || 0) < PAGE_COUNT;
      },
      reloadDeps: [address],
    }
  );
};
