import { useAsync } from 'react-use';
import { useEffect, useMemo } from 'react';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import {
  sumGrossWorth,
  groupAssets,
  MINI_ASSET_ID,
  MINI_DEBT_ID,
  SummaryData,
  Tokens,
} from './assets';

export type Summary = ReturnType<typeof useFetchSummary>;

const summaryLoadingAtom = atom(false);
const summaryDataAtom = atom<Summary>([]);

export const useFetchSummary = (
  addr: string | undefined,
  chain: string | null,
  updateNonce: number
) => {
  const { value, loading } = useAsync(async (): Promise<
    SummaryData | undefined
  > => {
    if (addr) {
      return walletOpenapi.getSummarizedAssetList(addr, chain || undefined);
    }
  }, [addr, chain, updateNonce]);
  const data = useMemo(
    () => (value ? sumGrossWorth(value) : undefined),
    [value]
  );

  const list = useMemo(() => {
    const maxItem = Math.max.apply(
      null,
      (data?.list || []).map((x) => Math.abs(x._value))
    );

    const maxAssets = Math.max(data?.netWorth || 0, maxItem);

    return data?.list?.length ? groupAssets(data.list, maxAssets) : [];
  }, [data]);

  const filterList = useMemo(() => {
    const _list = chain
      ? list.filter((m) => {
          return !(m as Tokens).chain || (m as Tokens).chain === chain;
        })
      : list;

    return _list.map((x) => ({
      ...x,
      symbol:
        x.id === MINI_ASSET_ID
          ? 'Other small assets'
          : x.id === MINI_DEBT_ID
          ? 'Other small debts'
          : x.symbol,
      // _netWorth: formatNetworth(Math.abs(x._value)),
    }));
  }, [chain, list]);

  const setSummaryLoading = useSetAtom(summaryLoadingAtom);
  const setSummaryData = useSetAtom(summaryDataAtom);

  useEffect(() => {
    setSummaryLoading(loading);
  }, [loading, setSummaryLoading]);

  useEffect(() => {
    setSummaryData(filterList);
  }, [filterList, setSummaryData]);

  return filterList;
};

export const useGetSummaryInfo = () => {
  const loading = useAtomValue(summaryLoadingAtom);
  const summary = useAtomValue(summaryDataAtom);
  return {
    loading,
    summary,
  };
};
