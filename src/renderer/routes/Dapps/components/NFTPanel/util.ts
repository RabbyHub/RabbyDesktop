import { atom } from 'jotai';

export const ZORE_MINT_FEE = 0.000777;

export type MintedData = {
  tokenId: string;
  contractAddress: string;
  detailUrl: string;
};

// need reset when account changed
export const isTweetAtom = atom<Record<string, boolean>>({});
