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
    if (WALLET_BRAND_CONTENT[account.brandName as WALLET_BRAND_TYPES]) {
      return;
    }

    wallet
      .requestKeyring(KEYRING_CLASS.WALLETCONNECT, 'getAccountsWithBrand', null)
      .then(
        (
          accounts: {
            address: string;
            brandName: string;
            type: string;
            realBrandUrl: string;
          }[]
        ) => {
          if (!accounts) return;

          const result = accounts.find((acc) => {
            if (acc.address !== account.address) return false;
            if (acc.brandName !== account.brandName) return false;
            return true;
          });

          if (!result) return;

          const img = new Image();
          img.onload = () => {
            setUrl(result.realBrandUrl);
          };
          img.onerror = () => {
            setUrl(WALLET_BRAND_CONTENT.WalletConnect.image);
          };
          img.src = result.realBrandUrl;
        }
      );
  }, [account]);

  return url;
};
