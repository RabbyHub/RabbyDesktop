import { CHAINS_ENUM, CHAINS_LIST } from '@debank/common';

import { getOriginFromUrl } from '@/isomorphic/url';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { atom, useAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSubscribeRpm } from '@/renderer/hooks-shell/useShellWallet';
import { usePreference } from './usePreference';
import useDebounceValue from '../useDebounceValue';

const siteAtom = atom(null as ConnectedSite | null);

function searchFilter(keyword: string) {
  return (item: typeof CHAINS_LIST[number]) =>
    [item.name, item.enum, item.nativeTokenSymbol].some((token) =>
      token.toLowerCase().includes(keyword)
    );
}

export function useCurrentConnection(
  tab: Pick<chrome.tabs.Tab, 'id' | 'url'>,
  nonce: number
) {
  const [currentSite, setCurrentSite] = useAtom(siteAtom);

  const { preferences, setChainPinned } = usePreference();

  const getCurrentSite = useCallback(async () => {
    if (!tab.id || !tab.url) return;
    const domain = getOriginFromUrl(tab.url);
    const current = await walletController.getCurrentSite(tab.id, domain);
    setCurrentSite(current);
  }, [tab.id, tab.url, setCurrentSite]);

  const switchChain = useCallback(
    async (chain: CHAINS_ENUM) => {
      if (!currentSite) return;
      await walletController.setSite({
        ...currentSite,
        chain,
      });
      getCurrentSite();
    },
    [currentSite, getCurrentSite]
  );

  const subscribeRpm = useSubscribeRpm();

  useEffect(() => {
    getCurrentSite();

    return subscribeRpm((payload) => {
      switch (payload.event) {
        default:
          break;
        case 'rabby:chainChanged': {
          getCurrentSite();
        }
      }
    });
  }, [subscribeRpm, getCurrentSite, nonce]);

  const removeConnectedSite = useCallback(
    async (origin: string) => {
      await walletController.removeConnectedSite(origin);
      getCurrentSite();
    },
    [getCurrentSite]
  );

  const { pinnedChains, unpinnedChains } = useMemo(() => {
    const pinnedSet = new Set(preferences.pinnedChain);
    const pinned: typeof CHAINS_LIST[number][] = [];
    const unpinned: typeof CHAINS_LIST[number][] = [];

    CHAINS_LIST.forEach((chain) => {
      if (pinnedSet.has(chain.enum)) {
        pinned.push(chain);
      } else {
        unpinned.push(chain);
      }
    });

    return {
      pinnedChains: pinned,
      unpinnedChains: unpinned,
    };
  }, [preferences.pinnedChain]);

  const [searchInput, setSearchInput] = useState('');
  const searchKeyword = useDebounceValue(searchInput, 250);

  const searchResult = useMemo(() => {
    const keyword = searchKeyword?.trim().toLowerCase();
    if (!keyword) {
      return {
        searchedPinned: [],
        searchedUnpinned: [],
        searchedChains: [],
      };
    }

    const filterFunc = searchFilter(keyword);

    const searchedPinned = pinnedChains.filter(filterFunc);
    const searchedUnpinned = unpinnedChains.filter(filterFunc);
    const searchedChains = [...searchedPinned, ...searchedUnpinned];

    return {
      searchedPinned,
      searchedUnpinned,
      searchedChains,
    };
  }, [pinnedChains, unpinnedChains, searchKeyword]);

  return {
    searchInput,
    currentSite,

    pinnedChains,
    unpinnedChains,

    searchedPinned: searchResult.searchedPinned,
    searchedUnpinned: searchResult.searchedUnpinned,
    searchedChains: searchResult.searchedChains,

    switchChain,
    setChainPinned,
    setSearchInput,
    removeConnectedSite,
  };
}
