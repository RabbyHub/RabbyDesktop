import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { isSameAddress } from '@/renderer/utils/address';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import React from 'react';

export const useToken = ({ tokenList }: { tokenList: TokenItem[] }) => {
  const [customize, setCustomize] = React.useState<TokenItem[]>([]);
  const [blocked, setBlocked] = React.useState<TokenItem[]>([]);

  const initData = React.useCallback(async () => {
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

    setCustomize(customTokenList);
    setBlocked(blockedTokenList);
  }, [tokenList]);

  React.useEffect(() => {
    initData();
  }, [initData]);

  return {
    customize,
    blocked,
  };
};
