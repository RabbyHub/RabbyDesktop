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

  console.log(
    'activeProviderOrigin?.shouldApproveToken',
    activeProviderOrigin?.shouldApproveToken,
    activeProviderOrigin
  );
  if (
    activeProviderOrigin?.activeTx &&
    !activeProviderOrigin?.shouldApproveToken &&
    activeSwapTxs.find(
      (e) => e.toLowerCase() === activeProviderOrigin?.activeTx?.toLowerCase()
    )
  ) {
    console.log(
      'activeProviderOrigin?.activeTx',
      activeProviderOrigin?.shouldApproveToken,
      activeProviderOrigin
    );
    return {
      ...activeProviderOrigin,
      activeTx: undefined,
      activeLoading: undefined,
    };
  }

  if (!activeProviderOrigin?.activeTx) {
    console.log(
      'activeProviderOrigin?.activeTx',
      activeProviderOrigin?.activeTx
    );
  }
  return activeProviderOrigin;
});
