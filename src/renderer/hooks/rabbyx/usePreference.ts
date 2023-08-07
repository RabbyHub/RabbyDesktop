import type { GasCache, Token } from '@/isomorphic/types/rabbyx';
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
  tokenApprovalChain: Record<string, import('@debank/common').CHAINS_ENUM>;
  nftApprovalChain: Record<string, import('@debank/common').CHAINS_ENUM>;
  customizedToken?: Token[];
  blockedToken?: Token[];
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
  tokenApprovalChain: {},
  nftApprovalChain: {},
  customizedToken: [],
  blockedToken: [],
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

  const getCustomizedToken = useCallback(async () => {
    return fetchPreference('customizedToken');
  }, [fetchPreference]);

  const getBlockedToken = useCallback(async () => {
    return fetchPreference('blockedToken');
  }, [fetchPreference]);

  const addCustomizeToken = async (token: TokenItem) => {
    await walletController.addCustomizedToken({
      address: token.id,
      chain: token.chain,
    });
    getCustomizedToken();
  };

  const removeCustomizedToken = async (token: TokenItem) => {
    await walletController.removeCustomizedToken({
      address: token.id,
      chain: token.chain,
    });
    getCustomizedToken();
  };

  const addBlockedToken = async (token: TokenItem) => {
    await walletController.addBlockedToken({
      address: token.id,
      chain: token.chain,
    });
    getBlockedToken();
  };

  const removeBlockedToken = async (token: TokenItem) => {
    await walletController.removeBlockedToken({
      address: token.id,
      chain: token.chain,
    });
    getBlockedToken();
  };

  return {
    preferences,

    setChainPinned,
    addCustomizeToken,
    removeCustomizedToken,
    addBlockedToken,
    removeBlockedToken,
    getBlockedToken,
    getCustomizedToken,
  };
}
