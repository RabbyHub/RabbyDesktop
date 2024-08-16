import { useSwapSupportedDexList } from '@/renderer/hooks/rabbyx/useSwap';
import { DEX_ENUM } from '@rabby-wallet/rabby-swap';
import { useCallback } from 'react';
import { DEX } from '../constant';
import {
  TDexQuoteData,
  isSwapWrapToken,
  getDexQuote,
  getDexQuoteParams,
} from '../utils';

export const useGetSwapAllQuotes = () => {
  const [supportedDEXList] = useSwapSupportedDexList();
  const getAllQuotes = useCallback(
    async (
      params: Omit<getDexQuoteParams, 'dexId'> & {
        setQuote: (quote: TDexQuoteData) => void;
      }
    ) => {
      if (
        isSwapWrapToken(
          params.payToken.id,
          params.receiveToken.id,
          params.chain
        )
      ) {
        return getDexQuote({
          ...params,
          dexId: DEX_ENUM.WRAPTOKEN,
        });
      }

      return Promise.all([
        ...(supportedDEXList.filter((e) => e in DEX) as DEX_ENUM[]).map(
          (dexId) => getDexQuote({ ...params, dexId })
        ),
      ]);
    },
    [supportedDEXList]
  );
  return getAllQuotes;
};
