import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { SwapToken } from './swap';

export const Swap = () => {
  const { currentAccount } = useCurrentAccount();
  return <SwapToken key={`${currentAccount?.address}`} />;
};
