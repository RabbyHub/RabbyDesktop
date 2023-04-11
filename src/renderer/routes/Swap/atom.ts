import { QuoteResult } from '@rabby-wallet/rabby-swap/dist/quote';
import { atom, useSetAtom } from 'jotai';

export type QuoteProvider = {
  name: string;
  error?: boolean;
  quote: QuoteResult | null;
  shouldApproveToken: boolean;
  shouldTwoStepApprove: boolean;
  halfBetterRate?: string;
  quoteWarning?: string;
  gasPrice?: number;
  activeLoading?: boolean;
  activeTx?: string;
};

export const activeSwapTxsAtom = atom<string[]>([]);

export const activeProviderOriginAtom = atom<QuoteProvider | undefined>(
  undefined
);

export const activeProviderAtom = atom((get) => {
  const activeSwapTxs = get(activeSwapTxsAtom);
  const activeProviderOrigin = get(activeProviderOriginAtom);

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
