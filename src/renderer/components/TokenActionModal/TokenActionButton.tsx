import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import React from 'react';
import { isSameAddress } from '@/renderer/utils/address';
import { Token } from '@/isomorphic/types/rabbyx';
import { usePreference } from '@/renderer/hooks/rabbyx/usePreference';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { CustomizedButton } from './CustomizedButton';
import { BlockedButton } from './BlockedButton';

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
  const [isAdded, setIsAdded] = React.useState(false);
  const handleAddToken = React.useCallback(
    (_token: TokenItem) => {
      if (!_token) return;

      if (_token.is_core) {
        addBlockedToken(_token);
      } else {
        addCustomizeToken(_token);
      }
      setIsAdded(true);
    },
    [addBlockedToken, addCustomizeToken]
  );

  const handleRemoveToken = React.useCallback(
    (_token: TokenItem) => {
      if (!_token) return;

      if (_token?.is_core) {
        removeBlockedToken(_token);
      } else {
        removeCustomizedToken(_token);
      }
      setIsAdded(false);
    },
    [removeBlockedToken, removeCustomizedToken]
  );

  const checkIsAdded = React.useCallback(async () => {
    if (!token) return;

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
  }, [token]);

  React.useEffect(() => {
    checkIsAdded();
  }, [checkIsAdded]);

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
