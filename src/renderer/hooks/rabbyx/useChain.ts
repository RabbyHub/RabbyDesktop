import { useState, useRef, useMemo, useCallback, useEffect } from 'react';

import { CHAINS_ENUM, Chain } from '@debank/common';
import { varyAndSortChainItems } from '@/isomorphic/wallet/chain';
import { findChainByEnum } from '@/renderer/utils';
import { useAccountBalanceMap } from './useAccount';
import { usePreference } from './usePreference';

type FetchDataStage = false | 'fetching' | 'fetched' | 'inited';
/**
 * @description support mainnet ONLY now
 */
export function useAsyncInitializeChainList({
  supportChains,
  onChainInitializedAsync,
}: {
  supportChains?: Chain['enum'][];
  onChainInitializedAsync?: (firstEnum: CHAINS_ENUM) => void;
}) {
  const { preferences, fetchPreference } = usePreference();

  const { matteredChainBalances, fetchBalance } = useAccountBalanceMap({
    isTestnet: false,
    disableAutoFetch: true,
  });

  const pinned = useMemo(
    () =>
      (preferences.pinnedChain?.filter((item) => findChainByEnum(item)) ||
        []) as CHAINS_ENUM[],
    [preferences.pinnedChain]
  );

  const { matteredList, unmatteredList } = useMemo(() => {
    return varyAndSortChainItems({
      supportChains,
      pinned,
      matteredChainBalances,
    });
  }, [pinned, supportChains, matteredChainBalances]);

  // const dispatch = useRabbyDispatch();

  const fetchChainDataStageRef = useRef<FetchDataStage>(false);
  const chainRef = useRef<CHAINS_ENUM>(CHAINS_ENUM.ETH);
  const [, setSpinner] = useState(0);
  const updateInitStage = useCallback(
    async (nextStage: Exclude<FetchDataStage, false>) => {
      if (!nextStage) return;
      fetchChainDataStageRef.current = nextStage;
      setSpinner((prev) => prev + 1);
    },
    []
  );

  const fetchDataOnce = useCallback(async () => {
    if (fetchChainDataStageRef.current) return;
    updateInitStage('fetching');

    await fetchPreference();
    await fetchBalance();
    updateInitStage('fetched');

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateInitStage]);

  useEffect(() => {
    fetchDataOnce();
  }, [fetchDataOnce]);

  const firstEnum = matteredList[0]?.enum;

  const markFinishInitializeChainExternally = useCallback(
    (chain: CHAINS_ENUM) => {
      if (fetchChainDataStageRef.current === 'fetched') {
        chainRef.current = chain;
        updateInitStage('inited');
      }
    },
    [updateInitStage]
  );

  useEffect(() => {
    if (firstEnum && fetchChainDataStageRef.current === 'fetched') {
      updateInitStage('inited');
      chainRef.current = firstEnum;
      onChainInitializedAsync?.(firstEnum);
    }
  }, [firstEnum, updateInitStage, onChainInitializedAsync]);

  return {
    matteredList,
    unmatteredList,
    pinned,
    fetchDataOnce,
    markFinishInitializeChainExternally,
  };
}
