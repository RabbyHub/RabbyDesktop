import { WALLET_BRAND_TYPES } from '@/renderer/utils/constant';
import React from 'react';
import { useCommonPopupView } from './useCommonPopupView';

export const SwitchChain: React.FC = () => {
  const { setTitle, account, setHeight } = useCommonPopupView();

  React.useEffect(() => {
    setTitle('How to switch');
    setHeight(420);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const url = React.useMemo(() => {
    switch (account?.brandName) {
      case WALLET_BRAND_TYPES.METAMASK:
        return 'rabby-internal:/assets/imgs/wallet/switch-chain-metamask.png';
      case WALLET_BRAND_TYPES.TP:
        return 'rabby-internal:/assets/imgs/wallet/switch-chain-tp.png';
      case WALLET_BRAND_TYPES.IMTOKEN:
        return 'rabby-internal:/assets/imgs/wallet/switch-chain-imtoken.png';
      case WALLET_BRAND_TYPES.TRUSTWALLET:
        return 'rabby-internal:/assets/imgs/wallet/switch-chain-trustwallet.png';
      default:
        return 'rabby-internal:/assets/imgs/wallet/switch-chain-common.png';
    }
  }, [account?.brandName]);
  return (
    <div className="p-[10px]">
      <img src={url} className="w-full" />
    </div>
  );
};
