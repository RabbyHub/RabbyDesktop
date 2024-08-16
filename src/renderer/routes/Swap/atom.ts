import { QuoteResult } from '@rabby-wallet/rabby-swap/dist/quote';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { DEX_ENUM } from '@rabby-wallet/rabby-swap';
import { QuotePreExecResultInfo } from './utils';

export type QuoteProvider = {
  name: string;
  error?: boolean;
  quote: QuoteResult | null;
  manualClick?: boolean;
  preExecResult: QuotePreExecResultInfo;
  shouldApproveToken: boolean;
  shouldTwoStepApprove: boolean;
  halfBetterRate?: string;
  quoteWarning?: [string, string];
  gasPrice?: number;
  activeLoading?: boolean;
  activeTx?: string;
  actualReceiveAmount: string | number;
  gasUsd?: string;
};

export const refreshIdAtom = atom(0, (get, set) => {
  set(refreshIdAtom, get(refreshIdAtom) + 1);
});

export const activeSwapTxsAtom = atom<string[]>([]);

export const activeProviderOriginAtom = atom<QuoteProvider | undefined>(
  undefined
);

export const activeProviderAtom = atom((get) => {
  const activeSwapTxs = get(activeSwapTxsAtom);
  const activeProviderOrigin = get(activeProviderOriginAtom);

  if (
    activeProviderOrigin?.name &&
    activeProviderOrigin?.name !== DEX_ENUM.WRAPTOKEN
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

const quoteVisibleAtom = atom(false);

export const useQuoteVisible = () => useAtomValue(quoteVisibleAtom);
export const useSetQuoteVisible = () => useSetAtom(quoteVisibleAtom);

const rabbyFeeAtom = atom<{
  visible: boolean;
  feeDexDesc?: string;
  dexName?: string;
}>({
  visible: false,
});

export const useRabbyFee = () => useAtomValue(rabbyFeeAtom);
export const useSetRabbyFee = () => useSetAtom(rabbyFeeAtom);
