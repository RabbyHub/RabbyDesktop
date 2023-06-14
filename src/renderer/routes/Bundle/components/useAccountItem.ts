import {
  WALLET_BRAND_TYPES,
  KEYRING_ICONS,
  WALLET_BRAND_CONTENT,
} from '@/renderer/utils/constant';
import React from 'react';

export const useAccountItemIcon = (data: BundleAccount) => {
  const brandName = React.useMemo(() => {
    switch (data.type) {
      case 'eth':
        return data.data.brandName as WALLET_BRAND_TYPES;
      case 'bn':
        return WALLET_BRAND_TYPES.Binance;
      case 'okx':
        return WALLET_BRAND_TYPES.OKX;
      case 'btc':
      default:
        return WALLET_BRAND_TYPES.Bitcoin;
    }
  }, [data]);

  const addressTypeIcon = React.useMemo(() => {
    switch (data.type) {
      case 'eth':
        return (
          KEYRING_ICONS[data.data.type] ||
          WALLET_BRAND_CONTENT?.[brandName]?.image
        );

      default:
        return WALLET_BRAND_CONTENT?.[brandName]?.image;
    }
  }, [brandName, data]);

  return addressTypeIcon;
};

export const useAccountItemAddress = (data: BundleAccount) => {
  const address = React.useMemo(() => {
    switch (data.type) {
      case 'eth':
        return data.data.address;
      case 'bn':
      case 'okx':
        return data.apiKey;
      case 'btc':
      default:
        return data.address;
    }
  }, [data]);

  return address;
};
