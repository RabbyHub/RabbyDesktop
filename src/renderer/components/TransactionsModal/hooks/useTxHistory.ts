import { walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { useInfiniteScroll } from 'ahooks';
import { last } from 'lodash';

const PAGE_COUNT = 20;

const fetchData = async ({
  id,
  start_time = 0,
  isFilterScam = false,
}: Parameters<typeof walletOpenapi.listTxHisotry>[0] & {
  id: string;
  isFilterScam?: boolean;
}) => {
  const getAllTxHistory = async (
    params: Parameters<typeof walletOpenapi.getAllTxHistory>[0]
  ) => {
    const _getHistory = walletOpenapi.getAllTxHistory;

    const res = await _getHistory(params);
    if (res.history_list) {
      res.history_list = res.history_list.filter((item) => {
        return !item.is_scam;
      });
    }
    return res;
  };
  const getHistory = walletOpenapi.listTxHisotry;

  const res = isFilterScam
    ? await getAllTxHistory({
        id,
        start_time,
      })
    : await getHistory({
        id,
        start_time,
        page_count: PAGE_COUNT,
      });

  const { project_dict, cate_dict, history_list: list } = res;
  const displayList = list
    .map((item) => ({
      ...item,
      projectDict: project_dict,
      cateDict: cate_dict,
      tokenDict: 'token_dict' in res ? res.token_dict : undefined,
      tokenUUIDDict: 'token_uuid_dict' in res ? res.token_uuid_dict : undefined,
    }))
    .sort((v1, v2) => v2.time_at - v1.time_at);
  return {
    last: last(displayList)?.time_at,
    list: displayList,
  };
};

export const useTxHistory = (
  address: string,
  target: NonNullable<Parameters<typeof useInfiniteScroll>[1]>['target'],
  isFilterScam = false
) => {
  return useInfiniteScroll(
    (d) => fetchData({ id: address, start_time: d?.last, isFilterScam }),
    {
      target,
      isNoMore: (d) => {
        return isFilterScam
          ? true
          : !d?.last || (d?.list.length || 0) < PAGE_COUNT;
      },
      reloadDeps: [address],
    }
  );
};
