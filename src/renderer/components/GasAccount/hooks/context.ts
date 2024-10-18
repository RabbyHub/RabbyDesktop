import { createContextState } from '@/renderer/hooks/contextState';

export const [
  GasAccountRefreshIdProvider,
  useGasAccountRefreshId,
  useGasAccountSetRefreshId,
] = createContextState(0);
