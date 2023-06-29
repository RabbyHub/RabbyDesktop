import { UsedChain } from '@rabby-wallet/rabby-api/dist/types';
import { CHAINS } from '@debank/common';

export interface DisplayChainWithWhiteLogo extends UsedChain {
  logo?: string;
  whiteLogo?: string;
}

export const formatChain = (item: UsedChain): DisplayChainWithWhiteLogo => {
  const chainsArray = Object.values(CHAINS);
  const chain = chainsArray.find((i) => i.id === item.community_id);

  return {
    ...item,
    logo: chain?.logo || item.logo_url,
    whiteLogo: chain?.whiteLogo,
  };
};
