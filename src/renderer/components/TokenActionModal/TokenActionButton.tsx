import { Token } from '@/isomorphic/types/rabbyx';
import { usePreference } from '@/renderer/hooks/rabbyx/usePreference';
import { useCustomTestnetTokens } from '@/renderer/hooks/rabbyx/useToken';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { isSameAddress } from '@/renderer/utils/address';
import { findChain } from '@/renderer/utils/chain';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import React from 'react';
import { BlockedButton } from './BlockedButton';
import { CustomizedButton } from './CustomizedButton';

interface Props {
  token: TokenItem;
}

export const TokenActionButton: React.FC<Props> = ({ token }) => {
  const {
    addBlockedToken,
    addCustomizeToken,
    removeBlockedToken,
    removeCustomizedToken,
  } = usePreference();
  const { addCustomTestnetToken, removeCustomTestnetToken } =
    useCustomTestnetTokens();
  const chain = findChain({
    serverId: token?.chain,
  });
  const [isAdded, setIsAdded] = React.useState(false);
  const handleAddToken = React.useCallback(
    (_token: TokenItem) => {
      if (!_token) return;

      if (chain?.isTestnet) {
        addCustomTestnetToken(_token);
      } else if (_token.is_core) {
        addBlockedToken(_token);
      } else {
        addCustomizeToken(_token);
      }
      setIsAdded(true);
    },
    [
      addBlockedToken,
      addCustomTestnetToken,
      addCustomizeToken,
      chain?.isTestnet,
    ]
  );

  const handleRemoveToken = React.useCallback(
    (_token: TokenItem) => {
      if (!_token) return;

      if (chain?.isTestnet) {
        removeCustomTestnetToken(_token);
      } else if (_token?.is_core) {
        removeBlockedToken(_token);
      } else {
        removeCustomizedToken(_token);
      }
      setIsAdded(false);
    },
    [
      chain?.isTestnet,
      removeBlockedToken,
      removeCustomTestnetToken,
      removeCustomizedToken,
    ]
  );

  const checkIsAdded = React.useCallback(async () => {
    if (!token) return;
    if (chain?.isTestnet) {
      const _isAdded = await walletController.isAddedCustomTestnetToken({
        chainId: chain.id,
        id: token.id,
      });
      setIsAdded(_isAdded);
      return;
    }

    let list: Token[] = [];
    if (token.is_core) {
      list = await walletController.getBlockedToken();
    } else {
      list = await walletController.getCustomizedToken();
    }

    const _isAdded = list.some(
      (item) =>
        isSameAddress(item.address, token.id) && item.chain === token.chain
    );
    setIsAdded(_isAdded);
  }, [chain?.id, chain?.isTestnet, token]);

  React.useEffect(() => {
    checkIsAdded();
  }, [checkIsAdded]);

  if (chain?.isTestnet) {
    if (chain.nativeTokenAddress === token.id) {
      return null;
    }
    return (
      <CustomizedButton
        selected={isAdded}
        onOpen={() => handleAddToken(token)}
        onClose={() => handleRemoveToken(token)}
      />
    );
  }

  return token.is_core ? (
    <BlockedButton
      selected={isAdded}
      onOpen={() => handleAddToken(token)}
      onClose={() => handleRemoveToken(token)}
    />
  ) : (
    <CustomizedButton
      selected={isAdded}
      onOpen={() => handleAddToken(token)}
      onClose={() => handleRemoveToken(token)}
    />
  );
};
