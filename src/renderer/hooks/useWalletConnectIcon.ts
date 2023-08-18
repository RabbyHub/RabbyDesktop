import React from 'react';
import { walletController } from '../ipcRequest/rabbyx';
import {
  KEYRING_CLASS,
  WALLET_BRAND_CONTENT,
  WALLET_BRAND_TYPES,
} from '../utils/constant';

const wallet = walletController;

export const useWalletConnectIcon = (
  account:
    | {
        address: string;
        brandName: string;
        type: string;
      }
    | undefined
    | null
) => {
  const [url, setUrl] = React.useState<string>();

  React.useEffect(() => {
    if (!account) return;
    if (
      account.type !== KEYRING_CLASS.WALLETCONNECT ||
      account.brandName !== WALLET_BRAND_TYPES.WalletConnect
    ) {
      return;
    }

    wallet.getCommonWalletConnectInfo(account.address).then((result) => {
      if (!result) return;

      const img = new Image();
      img.onload = () => {
        setUrl((result as any).realBrandUrl);
      };
      img.onerror = () => {
        setUrl(WALLET_BRAND_CONTENT.WalletConnect.image);
      };
      img.src = (result as any).realBrandUrl!;
    });
  }, [account]);

  return url;
};
