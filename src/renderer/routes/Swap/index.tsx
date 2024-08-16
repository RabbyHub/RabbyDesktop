import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { useSwapStateLoaded } from '@/renderer/hooks/rabbyx/useSwap';
import { SwapToken } from './swap';
import { Header } from './component/Header';

export const Swap = () => {
  const { currentAccount } = useCurrentAccount();
  const loaded = useSwapStateLoaded();
  return (
    <>
      <Header />
      {loaded && <SwapToken key={`${currentAccount?.address}`} />}
    </>
  );
};
