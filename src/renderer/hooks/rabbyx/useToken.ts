import { isSameAddress } from '@/renderer/utils/address';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { atom, useAtom } from 'jotai';
import React from 'react';
import { requestOpenApiWithChainId } from '@/main/utils/openapi';
import { findChainByServerID } from '@/renderer/utils/chain';
import { useCurrentAccount } from './useAccount';
import { usePreference } from './usePreference';

export const tokenListAtom = atom<TokenItem[]>([]);
export const blockedAtom = atom<TokenItem[]>([]);
export const customizeAtom = atom<TokenItem[]>([]);

export const useTokenAtom = () => {
  const [blocked] = useAtom(blockedAtom);
  const [customize] = useAtom(customizeAtom);

  return {
    blocked,
    customize,
  };
};

export const useToken = (isTestnet: boolean) => {
  const [, setCustomize] = useAtom(customizeAtom);
  const [, setBlocked] = useAtom(blockedAtom);
  const { preferences, getCustomizedToken, getBlockedToken } = usePreference();
  const [tokenList, setTokenList] = useAtom(tokenListAtom);
  const { currentAccount } = useCurrentAccount();

  const initData = React.useCallback(async () => {
    if (!currentAccount) return;
    const customizeTokens = (preferences.customizedToken ?? []).filter(
      (item) => {
        if (isTestnet) {
          return findChainByServerID(item.chain)?.isTestnet;
        }
        return !findChainByServerID(item.chain)?.isTestnet;
      }
    );
    const blockedTokens = (preferences.blockedToken ?? []).filter((item) => {
      if (isTestnet) {
        return findChainByServerID(item.chain)?.isTestnet;
      }
      return !findChainByServerID(item.chain)?.isTestnet;
    });
    const customTokenList: TokenItem[] = [];
    const blockedTokenList: TokenItem[] = [];

    tokenList.forEach((token) => {
      if (
        customizeTokens.find(
          (t) =>
            isSameAddress(token.id, t.address) &&
            token.chain === t.chain &&
            !token.is_core
        )
      ) {
        customTokenList.push(token);
      }

      if (
        blockedTokens.find(
          (t) =>
            isSameAddress(token.id, t.address) &&
            token.chain === t.chain &&
            token.is_core
        )
      ) {
        blockedTokenList.push(token);
      }
    });

    const noBalanceBlockedTokens = blockedTokens.filter((_token) => {
      return !blockedTokenList.find(
        (t) => isSameAddress(_token.address, t.id) && _token.chain === t.chain
      );
    });
    const noBalanceCustomizeTokens = customizeTokens.filter((_token) => {
      return !customTokenList.find(
        (t) => isSameAddress(_token.address, t.id) && _token.chain === t.chain
      );
    });

    try {
      if (noBalanceCustomizeTokens.length > 0) {
        const queryTokenList = await requestOpenApiWithChainId(
          ({ openapi }) =>
            openapi.customListToken(
              noBalanceCustomizeTokens.map(
                (item) => `${item.chain}:${item.address}`
              ),
              currentAccount.address
            ),
          {
            isTestnet,
          }
        );
        customTokenList.push(
          ...queryTokenList.filter((token) => !token.is_core)
        );
      }
    } catch (error) {
      console.log('error', error);
    }

    try {
      if (noBalanceBlockedTokens.length > 0) {
        const queryTokenList = await requestOpenApiWithChainId(
          ({ openapi }) =>
            openapi.customListToken(
              noBalanceBlockedTokens.map(
                (item) => `${item.chain}:${item.address}`
              ),
              currentAccount.address
            ),
          {
            isTestnet,
          }
        );
        blockedTokenList.push(
          ...queryTokenList.filter((token) => token.is_core)
        );
      }
    } catch (error) {
      console.log('error', error);
    }

    setCustomize(customTokenList);
    setBlocked(blockedTokenList);
  }, [
    currentAccount,
    isTestnet,
    preferences.blockedToken,
    preferences.customizedToken,
    setBlocked,
    setCustomize,
    tokenList,
  ]);

  React.useEffect(() => {
    getCustomizedToken();
    getBlockedToken();
  }, [getCustomizedToken, getBlockedToken]);

  React.useEffect(() => {
    if (!currentAccount?.address) return;
    initData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentAccount?.address,
    preferences.blockedToken,
    preferences.customizedToken,
    tokenList,
  ]);

  return {
    setTokenList,
  };
};
