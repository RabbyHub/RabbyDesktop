import { WALLET_BRAND_TYPES } from '@/renderer/utils/constant';
import React from 'react';
import { useCommonPopupView } from './useCommonPopupView';

export const SwitchAddress: React.FC = () => {
  const { setTitle, account, setHeight } = useCommonPopupView();

  React.useEffect(() => {
    setTitle('How to switch');
    setHeight(420);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const url = React.useMemo(() => {
    switch (account?.brandName) {
      case WALLET_BRAND_TYPES.METAMASK:
        return '/images/wallet/switch-address-metamask.png';
      case WALLET_BRAND_TYPES.TP:
        return '/images/wallet/switch-address-tp.png';
      case WALLET_BRAND_TYPES.IMTOKEN:
        return '/images/wallet/switch-address-imtoken.png';
      case WALLET_BRAND_TYPES.TRUSTWALLET:
        return '/images/wallet/switch-address-trustwallet.png';
      default:
        return '/images/wallet/switch-address-common.png';
    }
  }, [account?.brandName]);

  return (
    <div className="p-[10px]">
      <img src={url} className="w-full" />
    </div>
  );
};
