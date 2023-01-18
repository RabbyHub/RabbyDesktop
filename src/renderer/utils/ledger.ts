export enum LedgerHDPathType {
  LedgerLive = 'LedgerLive',
  Legacy = 'Legacy',
  BIP44 = 'BIP44',
}

export const LedgerHDPathTypeLabel = {
  [LedgerHDPathType.LedgerLive]: 'Ledger Live',
  [LedgerHDPathType.BIP44]: 'BIP44',
  [LedgerHDPathType.Legacy]: 'Legacy',
};
