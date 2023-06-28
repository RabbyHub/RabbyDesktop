import type { AddedToken, GasCache } from '@/isomorphic/types/rabbyx';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { CHAINS_ENUM } from '@debank/common';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { atom, useAtom } from 'jotai';
import { useCallback, useEffect } from 'react';

interface PreferenceState {
  externalLinkAck: boolean;
  useLedgerLive: boolean;
  locale: string;
  isDefaultWallet: boolean;
  lastTimeSendToken: Record<string, TokenItem>;
  walletSavedList: [];
  gasCache: GasCache;
  currentVersion: string;
  firstOpen: boolean;
  pinnedChain: import('@debank/common').CHAINS_ENUM[];
  AddedToken: AddedToken;
  tokenApprovalChain: Record<string, import('@debank/common').CHAINS_ENUM>;
  nftApprovalChain: Record<string, import('@debank/common').CHAINS_ENUM>;
}

const defaultState: PreferenceState = {
  externalLinkAck: false,
  useLedgerLive: false,
  locale: 'en',
  isDefaultWallet: true,
  lastTimeSendToken: {},
  walletSavedList: [],
  gasCache: {},
  currentVersion: '0',
  firstOpen: false,
  pinnedChain: [],
  AddedToken: {},
  tokenApprovalChain: {},
  nftApprovalChain: {},
};

const peferenceAtom = atom(defaultState);

export function usePreference() {
  const [preferences, setPreferences] = useAtom(peferenceAtom);

  const fetchPreference = useCallback(
    async (key?: keyof PreferenceState) => {
      if (key) {
        const value = await walletController.getPreference(key);
        setPreferences((prev) => {
          return {
            ...prev,
            [key]: value,
          };
        });
      } else {
        const pref = await walletController.getPreference();
        setPreferences(pref as any);
      }
    },
    [setPreferences]
  );

  useEffect(() => {
    fetchPreference();
  }, [fetchPreference]);

  const setChainPinned = useCallback(
    async (chain: CHAINS_ENUM, nextPinned = false) => {
      if (nextPinned) {
        await walletController.saveChain(chain);
      } else {
        const list = preferences.pinnedChain.filter((item) => item !== chain);
        await walletController.updateChain(list);
      }

      fetchPreference('pinnedChain');
    },
    [fetchPreference, preferences.pinnedChain]
  );

  return {
    preferences,

    setChainPinned,
  };
}
