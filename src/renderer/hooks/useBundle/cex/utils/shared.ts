import { Binance } from '../binance/binance';
import { OKX } from '../okx/okx';

const CexList = [Binance, OKX];

export const checkIsCexProtocol = (id: string) => {
  return CexList.some((cex) => cex.cexName === id);
};

export const checkIsCexChain = (id: string | null) => {
  return CexList.some((cex) => cex.cexName === id);
};
