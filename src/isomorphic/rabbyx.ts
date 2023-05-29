export function getRabbyXWindowPosition(viewType?: string | null) {
  switch (viewType) {
    case 'Connect':
    case 'SignTx':
    case 'SignText':
    case 'SignTypedData':
    case 'Decrypt':
    default: {
      return 'right-full' as const;
    }
    case 'ETHSign':
    case 'AddChain':
    case 'AddAsset':
    case 'GetPublicKey': {
      return 'center' as const;
    }
    case 'unknown': {
      return 'right-pinned' as const;
    }
  }
}
