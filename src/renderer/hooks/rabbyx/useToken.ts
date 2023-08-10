import { walletController, walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { isSameAddress } from '@/renderer/utils/address';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { atom, useAtom } from 'jotai';
import React from 'react';
import { useCurrentAccount } from './useAccount';

const tokenListAtom = atom<TokenItem[]>([]);

export const useToken = () => {
  const [customize, setCustomize] = React.useState<TokenItem[]>([]);
  const [blocked, setBlocked] = React.useState<TokenItem[]>([]);
  const [tokenList, setTokenList] = useAtom(tokenListAtom);
  const { currentAccount } = useCurrentAccount();

  const initData = React.useCallback(async () => {
    if (!currentAccount) return;
    const customizeTokens = await walletController.getCustomizedToken();
    const blockedTokens = await walletController.getBlockedToken();
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
        // customize with balance
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

    if (noBalanceCustomizeTokens.length > 0) {
      const queryTokenList = await walletOpenapi.customListToken(
        noBalanceCustomizeTokens.map((item) => `${item.chain}:${item.address}`),
        currentAccount.address
      );
      customTokenList.push(...queryTokenList.filter((token) => !token.is_core));
    }
    if (noBalanceBlockedTokens.length > 0) {
      const queryTokenList = await walletOpenapi.customListToken(
        noBalanceBlockedTokens.map((item) => `${item.chain}:${item.address}`),
        currentAccount.address
      );
      blockedTokenList.push(...queryTokenList.filter((token) => token.is_core));
    }

    setCustomize(customTokenList);
    setBlocked(blockedTokenList);
  }, [currentAccount, tokenList]);

  React.useEffect(() => {
    initData();
  }, [initData]);

  return {
    customize,
    blocked,
    setTokenList,
  };
};
