const RABBX_CENTERED_WINDOW_TYPES = [
  'Connect',
  'AddChain',
  'AddAsset',
  'GetPublicKey',
] as const;
export function isRabbyXCenteredWindowType(viewType?: string | null) {
  if (!viewType) return false;

  switch (viewType) {
    case 'SignTx':
    case 'SignText':
    case 'SignTypedData':
    case 'Decrypt':
    default: {
      return false;
    }
    case 'ETHSign':
    case 'Connect':
    case 'AddChain':
    case 'AddAsset':
    case 'GetPublicKey': {
      return true;
    }
  }
}
