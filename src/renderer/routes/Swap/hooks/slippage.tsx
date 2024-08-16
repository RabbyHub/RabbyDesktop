import { useSwap } from '@/renderer/hooks/rabbyx/useSwap';
import { useCallback, useMemo, useState } from 'react';

export const useSlippageStore = () => {
  const { swap, setAutoSlippage, setIsCustomSlippage, setSlippage } = useSwap();
  const { slippage, autoSlippage, isCustomSlippage } = swap;

  return {
    slippage,
    setSlippage,
    autoSlippage,
    setAutoSlippage,
    isCustomSlippage,
    setIsCustomSlippage,
  };
};

export const useSlippage = () => {
  const { slippage: previousSlippage, setSlippage: setSlippageOnStore } =
    useSlippageStore();
  const [slippageState, setSlippageState] = useState(previousSlippage || '0.1');

  const slippage = useMemo(() => slippageState || '0.1', [slippageState]);
  const [slippageChanged, setSlippageChanged] = useState(false);

  const setSlippage = useCallback(
    (slippageValue: string) => {
      setSlippageOnStore(slippageValue);
      setSlippageState(slippageValue);
    },
    [setSlippageOnStore]
  );

  return {
    slippageChanged,
    setSlippageChanged,
    slippageState,
    slippage,
    setSlippage,
  };
};
