import { QuoteResult } from '@rabby-wallet/rabby-swap/dist/quote';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { CEX, DEX } from './constant';

export type QuoteProvider = {
  name: string;
  error?: boolean;
  quote: QuoteResult | null;
  shouldApproveToken: boolean;
  shouldTwoStepApprove: boolean;
  halfBetterRate?: string;
  quoteWarning?: [string, string];
  gasPrice?: number;
  activeLoading?: boolean;
  activeTx?: string;
  actualReceiveAmount: string | number;
};

export const refreshIdAtom = atom(0, (get, set) => {
  set(refreshIdAtom, get(refreshIdAtom) + 1);
});

export const activeSwapTxsAtom = atom<string[]>([]);

export const activeProviderOriginAtom = atom<QuoteProvider | undefined>(
  undefined
);

export const swapViewListAtom = atomWithStorage(
  'SWAP_VIEW_QUOTES',
  {} as Record<keyof typeof DEX | keyof typeof CEX, boolean>
);

export const swapTradListAtom = atomWithStorage(
  'SWAP_TRADE_QUOTES',
  {} as Record<keyof typeof DEX | keyof typeof CEX, boolean>
);

export const activeProviderAtom = atom((get) => {
  const activeSwapTxs = get(activeSwapTxsAtom);
  const activeProviderOrigin = get(activeProviderOriginAtom);
  const swapTradList = get(swapTradListAtom);

  if (
    activeProviderOrigin?.name &&
    swapTradList?.[activeProviderOrigin?.name as keyof typeof swapTradList] !==
      true
  ) {
    return;
  }

  if (
    activeProviderOrigin?.activeTx &&
    !activeProviderOrigin?.shouldApproveToken &&
    activeSwapTxs.find(
      (e) => e.toLowerCase() === activeProviderOrigin?.activeTx?.toLowerCase()
    )
  ) {
    return {
      ...activeProviderOrigin,
      activeTx: undefined,
      activeLoading: undefined,
    };
  }

  return activeProviderOrigin;
});

export const swapSettingVisibleAtom = atom(false);
