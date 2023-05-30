import { walletController } from '@/renderer/ipcRequest/rabbyx';
import {
  WALLET_BRAND_CONTENT,
  WALLET_BRAND_TYPES,
} from '@/renderer/utils/constant';
import React from 'react';

export const WALLET_BRAND_NAME_KEY: Record<string, WALLET_BRAND_TYPES> = {};

Object.keys(WALLET_BRAND_CONTENT).forEach((key) => {
  const type = key as WALLET_BRAND_TYPES;
  WALLET_BRAND_NAME_KEY[WALLET_BRAND_CONTENT[type].name] = type;
});

export const useDisplayBrandName = (
  brandName = WALLET_BRAND_TYPES.WalletConnect,
  address?: string
) => {
  const [realBrandName, setRealBrandName] =
    React.useState<WALLET_BRAND_TYPES>(brandName);
  const displayBrandName: string =
    WALLET_BRAND_CONTENT[realBrandName]?.name ||
    WALLET_BRAND_CONTENT[WALLET_BRAND_NAME_KEY[realBrandName]]?.name ||
    realBrandName;

  React.useEffect(() => {
    if (brandName !== WALLET_BRAND_TYPES.WalletConnect) {
      setRealBrandName(brandName);
      return;
    }
    if (address) {
      walletController.getCommonWalletConnectInfo(address).then((result) => {
        if (!result) return;
        setRealBrandName(
          (result.realBrandName || result.brandName) as WALLET_BRAND_TYPES
        );
      });
    }
  }, [address, brandName]);

  return [displayBrandName, realBrandName];
};
