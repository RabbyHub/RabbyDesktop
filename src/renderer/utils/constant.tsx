import { CHAINS_ENUM } from '@debank/common';

const IconAmber = 'ui/assets/walletlogo/amber.svg';
const LogoAmber = 'ui/assets/walletlogo/amber.svg';
const IconBitBox02 = 'rabby-internal://assets/icons/walletlogo/bitbox.svg';
const IconBitBox02WithBorder =
  'rabby-internal://assets/icons/walletlogo/bitbox.svg';
const IconCobo = 'rabby-internal://assets/icons/walletlogo/cobo.svg';
const LogoCobo = 'rabby-internal://assets/icons/walletlogo/cobo.svg';
const IconFireblocksWithBorder =
  'rabby-internal://assets/icons/walletlogo/fireblocks.svg';
const IconFireblocks =
  'rabby-internal://assets/icons/walletlogo/fireblocks.svg';
const IconGnosis = 'rabby-internal://assets/icons/walletlogo/gnosis.svg';
const IconGridPlus = 'rabby-internal://assets/icons/walletlogo/gridplus.svg';
const IconImtoken = 'rabby-internal://assets/icons/walletlogo/imtoken.svg';
const LogoImtoken = 'rabby-internal://assets/icons/walletlogo/imtoken.svg';
const IconJade = 'rabby-internal://assets/icons/walletlogo/jade.svg';
const LogoJade = 'rabby-internal://assets/icons/walletlogo/jade.svg';
const LogoKeystone = 'rabby-internal://assets/icons/walletlogo/keystone.svg';
const LogoNgrave = 'rabby-internal://assets/icons/walletlogo/ngrave.svg';
const LogoAirGap = 'rabby-internal://assets/icons/walletlogo/airgap.svg';
const LogoLedgerDark = 'rabby-internal://assets/icons/walletlogo/ledger.svg';
const LogoLedgerWhite = 'rabby-internal://assets/icons/walletlogo/ledger.svg';
const IconMath = 'rabby-internal://assets/icons/walletlogo/math.svg';
const LogoMath = 'rabby-internal://assets/icons/walletlogo/math.svg';
const IconMetaMask = 'rabby-internal://assets/icons/walletlogo/metamask.svg';
const IconMnemonicInk =
  'rabby-internal://assets/icons/walletlogo/mnemonic-ink.svg';
const IconMnemonicWhite =
  'rabby-internal://assets/icons/walletlogo/IconMnemonic-white.svg';
const LogoMnemonic =
  'rabby-internal://assets/icons/walletlogo/mnemoniclogo.svg';
const IconOnekey = 'rabby-internal://assets/icons/walletlogo/onekey.svg';
const IconOneKey18 = 'rabby-internal://assets/icons/walletlogo/onekey.svg';
const LogoOnekey = 'rabby-internal://assets/icons/walletlogo/onekey.svg';
const IconPrivateKeyWhite =
  'rabby-internal://assets/icons/walletlogo/private-key-white.svg';
const IconPrivateKeyInk =
  'rabby-internal://assets/icons/walletlogo/privatekeylogo.svg';
const LogoPrivateKey =
  'rabby-internal://assets/icons/walletlogo/privatekeylogo.svg';
const LogoTp = 'rabby-internal://assets/icons/walletlogo/tp.svg';
const IconTokenpocket = 'rabby-internal://assets/icons/walletlogo/tp.svg';
const IconTrezor = 'rabby-internal://assets/icons/walletlogo/trezor.svg';
const IconTrezor24Border =
  'rabby-internal://assets/icons/walletlogo/trezor.svg';
const IconTrezor24 = 'rabby-internal://assets/icons/walletlogo/trezor.svg';
const LogoTrezor = 'rabby-internal://assets/icons/walletlogo/trezor.svg';
const LogoTrust = 'rabby-internal://assets/icons/walletlogo/trust.svg';
const IconTrust = 'rabby-internal://assets/icons/walletlogo/trust.svg';
const LogoCoolWallet =
  'rabby-internal://assets/icons/walletlogo/coolwallet.svg';
const IconWatchPurple =
  'rabby-internal://assets/icons/walletlogo/watch-purple.svg';
const IconWatchWhite =
  'rabby-internal://assets/icons/walletlogo/IconWatch-white.svg';
const LogoDefiant = 'rabby-internal://assets/icons/walletlogo/defiant.svg';
const LogoDefiantWhite = 'rabby-internal://assets/icons/walletlogo/defiant.svg';
const LogoWalletConnect =
  'rabby-internal://assets/icons/walletlogo/walletconnect28.svg';
const IconWalletConnect =
  'rabby-internal://assets/icons/walletlogo/walletconnect28.svg';
const IconBinance = 'rabby-internal://assets/icons/walletlogo/binance.png';
const IconBitcoin = 'rabby-internal://assets/icons/walletlogo/bitcoin.svg';
const IconOKX = 'rabby-internal://assets/icons/bundle/okx.png';
const LogoBitkeep = 'rabby-internal://assets/icons/walletlogo/bitkeep.svg';
const LogoRainbow = 'rabby-internal://assets/icons/walletlogo/rainbow.svg';
const LogoUniswap = 'rabby-internal://assets/icons/walletlogo/uniswap.svg';
const LogoZerion = 'rabby-internal://assets/icons/walletlogo/zerion.svg';
const LogoCoboArgus = 'rabby-internal://assets/icons/walletlogo/coboargus.svg';

export { CHAINS_ENUM };

export const KEYRING_TYPE = {
  HdKeyring: 'HD Key Tree',
  SimpleKeyring: 'Simple Key Pair',
  HardwareKeyring: 'hardware',
  WatchAddressKeyring: 'Watch Address',
  WalletConnectKeyring: 'WalletConnect',
  GnosisKeyring: 'Gnosis',
};

export const KEYRING_CLASS = {
  PRIVATE_KEY: 'Simple Key Pair',
  MNEMONIC: 'HD Key Tree',
  HARDWARE: {
    BITBOX02: 'BitBox02 Hardware',
    TREZOR: 'Trezor Hardware',
    LEDGER: 'Ledger Hardware',
    ONEKEY: 'Onekey Hardware',
    GRIDPLUS: 'GridPlus Hardware',
    KEYSTONE: 'QR Hardware Wallet Device',
  },
  WATCH: 'Watch Address',
  WALLETCONNECT: 'WalletConnect',
  GNOSIS: 'Gnosis',
};

export const KEYRING_WITH_INDEX = [
  KEYRING_CLASS.HARDWARE.LEDGER,
  KEYRING_CLASS.HARDWARE.GRIDPLUS,
];

export const SUPPORT_1559_KEYRING_TYPE = [
  KEYRING_CLASS.HARDWARE.LEDGER,
  KEYRING_CLASS.HARDWARE.GRIDPLUS,
  KEYRING_CLASS.PRIVATE_KEY,
  KEYRING_CLASS.MNEMONIC,
  KEYRING_CLASS.HARDWARE.KEYSTONE,
  KEYRING_CLASS.HARDWARE.TREZOR,
];

export const KEYRING_TYPE_TEXT = {
  [KEYRING_TYPE.HdKeyring]: 'Created by Seed Phrase',
  [KEYRING_TYPE.SimpleKeyring]: 'Imported by Private Key',
  [KEYRING_TYPE.WatchAddressKeyring]: 'Contact',
  [KEYRING_CLASS.HARDWARE.BITBOX02]: 'Imported by BitBox02',
  [KEYRING_CLASS.HARDWARE.LEDGER]: 'Imported by Ledger',
  [KEYRING_CLASS.HARDWARE.TREZOR]: 'Imported by Trezor',
  [KEYRING_CLASS.HARDWARE.ONEKEY]: 'Imported by Onekey',
  [KEYRING_CLASS.HARDWARE.GRIDPLUS]: 'Imported by GridPlus',
  [KEYRING_CLASS.GNOSIS]: 'Imported by Safe',
  [KEYRING_CLASS.HARDWARE.KEYSTONE]: 'Imported by QRCode Base',
};
export const BRAND_ALIAN_TYPE_TEXT = {
  [KEYRING_TYPE.HdKeyring]: 'Seed Phrase',
  [KEYRING_TYPE.SimpleKeyring]: 'Private Key',
  [KEYRING_TYPE.WatchAddressKeyring]: 'Contact',
  [KEYRING_CLASS.HARDWARE.LEDGER]: 'Ledger',
  [KEYRING_CLASS.HARDWARE.TREZOR]: 'Trezor',
  [KEYRING_CLASS.HARDWARE.ONEKEY]: 'Onekey',
  [KEYRING_CLASS.HARDWARE.BITBOX02]: 'BitBox02',
  [KEYRING_CLASS.GNOSIS]: 'Safe',
  [KEYRING_CLASS.HARDWARE.GRIDPLUS]: 'GridPlus',
  [KEYRING_CLASS.HARDWARE.KEYSTONE]: 'Keystone',
};

export const HARDWARE_KEYRING_TYPES = {
  BitBox02: {
    type: 'BitBox02 Hardware',
    brandName: 'BitBox02',
  },
  Ledger: {
    type: 'Ledger Hardware',
    brandName: 'Ledger',
  },
  Trezor: {
    type: 'Trezor Hardware',
    brandName: 'Trezor',
  },
  Onekey: {
    type: 'Onekey Hardware',
    brandName: 'Onekey',
  },
  GridPlus: {
    type: 'GridPlus Hardware',
    brandName: 'GridPlus',
  },
  Keystone: {
    type: 'QR Hardware Wallet Device',
    brandName: 'Keystone',
  },
  NgraveZero: {
    type: 'QR Hardware Wallet Device',
    brandName: 'NGRAVE ZERO',
  },
};

export enum TX_TYPE_ENUM {
  SEND = 1,
  APPROVE = 2,
  CANCEL_APPROVE = 3,
  CANCEL_TX = 4,
  SIGN_TX = 5,
}

export const IS_CHROME = /Chrome\//i.test(global.navigator?.userAgent);

export const IS_FIREFOX = /Firefox\//i.test(global.navigator?.userAgent);

export const IS_LINUX = /linux/i.test(global.navigator?.userAgent);

let chromeVersion: number | null = null;

if (IS_CHROME) {
  const matches = global.navigator?.userAgent.match(/Chrome\/(\d+[^.\s])/);
  if (matches && matches.length >= 2) {
    chromeVersion = Number(matches[1]);
  }
}

export const IS_AFTER_CHROME91 = IS_CHROME
  ? chromeVersion && chromeVersion >= 91
  : false;

export const GAS_LEVEL_TEXT = {
  slow: 'Standard',
  normal: 'Fast',
  fast: 'Instant',
  custom: 'Custom',
};

export const IS_WINDOWS = /windows/i.test(global.navigator?.userAgent);

export const CHECK_METAMASK_INSTALLED_URL = {
  Chrome: 'chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/phishing.html',
  Firefox: '',
  Brave: '',
  Edge: '',
};

export const SAFE_RPC_METHODS = [
  'eth_blockNumber',
  'eth_call',
  'eth_chainId',
  'eth_coinbase',
  'eth_decrypt',
  'eth_estimateGas',
  'eth_gasPrice',
  'eth_getBalance',
  'eth_getBlockByHash',
  'eth_getBlockByNumber',
  'eth_getBlockTransactionCountByHash',
  'eth_getBlockTransactionCountByNumber',
  'eth_getCode',
  'eth_getEncryptionPublicKey',
  'eth_getFilterChanges',
  'eth_getFilterLogs',
  'eth_getLogs',
  'eth_getProof',
  'eth_getStorageAt',
  'eth_getTransactionByBlockHashAndIndex',
  'eth_getTransactionByBlockNumberAndIndex',
  'eth_getTransactionByHash',
  'eth_getTransactionCount',
  'eth_getTransactionReceipt',
  'eth_getUncleByBlockHashAndIndex',
  'eth_getUncleByBlockNumberAndIndex',
  'eth_getUncleCountByBlockHash',
  'eth_getUncleCountByBlockNumber',
  'eth_getWork',
  'eth_hashrate',
  'eth_mining',
  'eth_newBlockFilter',
  'eth_newFilter',
  'eth_newPendingTransactionFilter',
  'eth_protocolVersion',
  'eth_sendRawTransaction',
  'eth_sendTransaction',
  'eth_submitHashrate',
  'eth_submitWork',
  'eth_syncing',
  'eth_uninstallFilter',
  'wallet_requestPermissions',
  'wallet_getPermissions',
  'net_version',
];

export const MINIMUM_GAS_LIMIT = 21000;

export enum WATCH_ADDRESS_CONNECT_TYPE {
  WalletConnect = 'WalletConnect',
}

export enum BRAND_WALLET_CONNECT_TYPE {
  WalletConnect = 'WalletConnect',
  BitBox02Connect = 'BitBox02Connect',
  LedgerConnect = 'LedgerConnect',
  OneKeyConnect = 'OneKeyConnect',
  TrezorConnect = 'TrezorConnect',
  GnosisConnect = 'GnosisConnect',
  GridPlusConnect = 'GridPlusConnect',
  QRCodeBase = 'QR Hardware Wallet Device',
  CoboArgusConnect = 'CoboArgusConnect',
  Bundle = 'Bundle',
}

export const WALLETCONNECT_STATUS_MAP = {
  PENDING: 1,
  CONNECTED: 2,
  WAITING: 3,
  SIBMITTED: 4,
  REJECTED: 5,
  FAILD: 6,
};

export const INTERNAL_REQUEST_ORIGIN = window.location.origin;

export const INTERNAL_REQUEST_SESSION = {
  name: 'Rabby',
  origin: INTERNAL_REQUEST_ORIGIN,
  icon: './images/icon-128.png',
};

export const INITIAL_OPENAPI_URL = 'https://api.rabby.io';

export const EVENTS = {
  broadcastToUI: 'broadcastToUI',
  broadcastToBackground: 'broadcastToBackground',
  TX_COMPLETED: 'TX_COMPLETED',
  SIGN_FINISHED: 'SIGN_FINISHED',
  WALLETCONNECT: {
    STATUS_CHANGED: 'WALLETCONNECT_STATUS_CHANGED',
    INIT: 'WALLETCONNECT_INIT',
    INITED: 'WALLETCONNECT_INITED',
    TRANSPORT_ERROR: 'TRANSPORT_ERROR',
    SESSION_STATUS_CHANGED: 'SESSION_STATUS_CHANGED',
    SESSION_ACCOUNT_CHANGED: 'SESSION_ACCOUNT_CHANGED',
    SESSION_NETWORK_DELAY: 'SESSION_NETWORK_DELAY',
  },
  GNOSIS: {
    TX_BUILT: 'TransactionBuilt',
    TX_CONFIRMED: 'TransactionConfirmed',
  },
  QRHARDWARE: {
    ACQUIRE_MEMSTORE_SUCCEED: 'ACQUIRE_MEMSTORE_SUCCEED',
  },
  LEDGER: {
    REJECTED: 'LEDGER_REJECTED',
    REJECT_APPROVAL: 'LEDGER_REJECT_APPROVAL',
    SESSION_CHANGE: 'LEDGER_SESSION_CHANGE',
  },
  COMMON_HARDWARE: {
    REJECTED: 'COMMON_HARDWARE_REJECTED',
  },
  LOCK_WALLET: 'LOCK_WALLET',
  RELOAD_TX: 'RELOAD_TX',
};

export enum WALLET_BRAND_TYPES {
  AMBER = 'AMBER',
  BITBOX02 = 'BITBOX02',
  COBO = 'COBO',
  FIREBLOCKS = 'FIREBLOCKS',
  IMTOKEN = 'IMTOKEN',
  JADE = 'JADE',
  LEDGER = 'LEDGER',
  MATHWALLET = 'MATHWALLET',
  ONEKEY = 'ONEKEY',
  TP = 'TP',
  TREZOR = 'TREZOR',
  TRUSTWALLET = 'TRUSTWALLET',
  GNOSIS = 'Gnosis',
  GRIDPLUS = 'GRIDPLUS',
  METAMASK = 'MetaMask',
  KEYSTONE = 'Keystone',
  COOLWALLET = 'CoolWallet',
  DEFIANT = 'Defiant',
  AIRGAP = 'AirGap',
  WalletConnect = 'WalletConnect',
  Binance = 'Binance',
  OKX = 'OKX',
  Bitcoin = 'Bitcoin',
  Rainbow = 'Rainbow',
  Bitkeep = 'Bitget',
  // Uniswap = 'Uniswap',
  Zerion = 'Zerion',
  CoboArgus = 'CoboArgus',
  NGRAVEZERO = 'NGRAVE',
}

export enum WALLET_BRAND_CATEGORY {
  MOBILE = 'mobile',
  HARDWARE = 'hardware',
  INSTITUTIONAL = 'institutional',
}

export type IWalletBrandContent = {
  id: number;
  name: string;
  brand: WALLET_BRAND_TYPES;
  icon: string;
  image: string;
  connectType: BRAND_WALLET_CONNECT_TYPE;
  category: WALLET_BRAND_CATEGORY;
};

export const WALLET_BRAND_CONTENT: {
  [K in WALLET_BRAND_TYPES]: IWalletBrandContent;
} = {
  [WALLET_BRAND_TYPES.AMBER]: {
    id: 0,
    name: 'Amber',
    brand: WALLET_BRAND_TYPES.AMBER,
    icon: IconAmber,
    image: LogoAmber,
    connectType: BRAND_WALLET_CONNECT_TYPE.WalletConnect,
    category: WALLET_BRAND_CATEGORY.INSTITUTIONAL,
  },
  [WALLET_BRAND_TYPES.BITBOX02]: {
    id: 10,
    name: 'BitBox02',
    brand: WALLET_BRAND_TYPES.BITBOX02,
    icon: IconBitBox02,
    image: IconBitBox02WithBorder,
    connectType: BRAND_WALLET_CONNECT_TYPE.BitBox02Connect,
    category: WALLET_BRAND_CATEGORY.HARDWARE,
  },
  [WALLET_BRAND_TYPES.COBO]: {
    id: 1,
    name: 'Cobo Wallet',
    brand: WALLET_BRAND_TYPES.COBO,
    icon: IconCobo,
    image: LogoCobo,
    connectType: BRAND_WALLET_CONNECT_TYPE.WalletConnect,
    category: WALLET_BRAND_CATEGORY.INSTITUTIONAL,
  },
  [WALLET_BRAND_TYPES.COOLWALLET]: {
    id: 16,
    name: 'CoolWallet',
    brand: WALLET_BRAND_TYPES.COOLWALLET,
    icon: LogoCoolWallet,
    image: LogoCoolWallet,
    connectType: BRAND_WALLET_CONNECT_TYPE.QRCodeBase,
    category: WALLET_BRAND_CATEGORY.HARDWARE,
  },
  [WALLET_BRAND_TYPES.DEFIANT]: {
    id: 17,
    name: 'Defiant',
    brand: WALLET_BRAND_TYPES.DEFIANT,
    icon: LogoDefiant,
    image: LogoDefiantWhite,
    connectType: BRAND_WALLET_CONNECT_TYPE.WalletConnect,
    category: WALLET_BRAND_CATEGORY.MOBILE,
  },
  [WALLET_BRAND_TYPES.FIREBLOCKS]: {
    id: 11,
    name: 'FireBlocks',
    brand: WALLET_BRAND_TYPES.FIREBLOCKS,
    icon: IconFireblocks,
    image: IconFireblocksWithBorder,
    connectType: BRAND_WALLET_CONNECT_TYPE.WalletConnect,
    category: WALLET_BRAND_CATEGORY.INSTITUTIONAL,
  },
  [WALLET_BRAND_TYPES.GNOSIS]: {
    id: 13,
    name: 'Gnosis Safe',
    brand: WALLET_BRAND_TYPES.GNOSIS,
    icon: IconGnosis,
    image: IconGnosis,
    connectType: BRAND_WALLET_CONNECT_TYPE.GnosisConnect,
    category: WALLET_BRAND_CATEGORY.INSTITUTIONAL,
  },
  [WALLET_BRAND_TYPES.GRIDPLUS]: {
    id: 12,
    name: 'GridPlus',
    brand: WALLET_BRAND_TYPES.GRIDPLUS,
    icon: IconGridPlus,
    image: IconGridPlus,
    connectType: BRAND_WALLET_CONNECT_TYPE.GridPlusConnect,
    category: WALLET_BRAND_CATEGORY.HARDWARE,
  },
  [WALLET_BRAND_TYPES.IMTOKEN]: {
    id: 2,
    name: 'imToken',
    brand: WALLET_BRAND_TYPES.IMTOKEN,
    icon: IconImtoken,
    image: LogoImtoken,
    connectType: BRAND_WALLET_CONNECT_TYPE.WalletConnect,
    category: WALLET_BRAND_CATEGORY.MOBILE,
  },
  [WALLET_BRAND_TYPES.JADE]: {
    id: 3,
    name: 'Jade Wallet',
    brand: WALLET_BRAND_TYPES.JADE,
    icon: IconJade,
    image: LogoJade,
    connectType: BRAND_WALLET_CONNECT_TYPE.WalletConnect,
    category: WALLET_BRAND_CATEGORY.INSTITUTIONAL,
  },
  [WALLET_BRAND_TYPES.KEYSTONE]: {
    id: 15,
    name: 'Keystone',
    brand: WALLET_BRAND_TYPES.KEYSTONE,
    icon: LogoKeystone,
    image: LogoKeystone,
    connectType: BRAND_WALLET_CONNECT_TYPE.QRCodeBase,
    category: WALLET_BRAND_CATEGORY.HARDWARE,
  },
  [WALLET_BRAND_TYPES.AIRGAP]: {
    id: 18,
    name: 'AirGap Vault',
    brand: WALLET_BRAND_TYPES.AIRGAP,
    icon: LogoAirGap,
    image: LogoAirGap,
    connectType: BRAND_WALLET_CONNECT_TYPE.QRCodeBase,
    category: WALLET_BRAND_CATEGORY.HARDWARE,
  },
  [WALLET_BRAND_TYPES.LEDGER]: {
    id: 4,
    name: 'Ledger',
    brand: WALLET_BRAND_TYPES.LEDGER,
    icon: LogoLedgerWhite,
    image: LogoLedgerDark,
    connectType: BRAND_WALLET_CONNECT_TYPE.LedgerConnect,
    category: WALLET_BRAND_CATEGORY.HARDWARE,
  },
  [WALLET_BRAND_TYPES.MATHWALLET]: {
    id: 5,
    name: 'Math Wallet',
    brand: WALLET_BRAND_TYPES.MATHWALLET,
    icon: IconMath,
    image: LogoMath,
    connectType: BRAND_WALLET_CONNECT_TYPE.WalletConnect,
    category: WALLET_BRAND_CATEGORY.MOBILE,
  },
  [WALLET_BRAND_TYPES.METAMASK]: {
    id: 14,
    name: 'MetaMask',
    brand: WALLET_BRAND_TYPES.METAMASK,
    icon: IconMetaMask,
    image: IconMetaMask,
    connectType: BRAND_WALLET_CONNECT_TYPE.WalletConnect,
    category: WALLET_BRAND_CATEGORY.MOBILE,
  },
  [WALLET_BRAND_TYPES.ONEKEY]: {
    id: 6,
    name: 'OneKey',
    brand: WALLET_BRAND_TYPES.ONEKEY,
    icon: IconOnekey,
    image: LogoOnekey,
    connectType: BRAND_WALLET_CONNECT_TYPE.OneKeyConnect,
    category: WALLET_BRAND_CATEGORY.HARDWARE,
  },
  [WALLET_BRAND_TYPES.TP]: {
    id: 7,
    name: 'TokenPocket',
    brand: WALLET_BRAND_TYPES.TP,
    icon: IconTokenpocket,
    image: LogoTp,
    connectType: BRAND_WALLET_CONNECT_TYPE.WalletConnect,
    category: WALLET_BRAND_CATEGORY.MOBILE,
  },
  [WALLET_BRAND_TYPES.TREZOR]: {
    id: 8,
    name: 'Trezor',
    brand: WALLET_BRAND_TYPES.TREZOR,
    icon: IconTrezor,
    image: LogoTrezor,
    connectType: BRAND_WALLET_CONNECT_TYPE.TrezorConnect,
    category: WALLET_BRAND_CATEGORY.HARDWARE,
  },
  [WALLET_BRAND_TYPES.TRUSTWALLET]: {
    id: 9,
    name: 'Trust Wallet',
    brand: WALLET_BRAND_TYPES.TRUSTWALLET,
    icon: IconTrust,
    image: LogoTrust,
    connectType: BRAND_WALLET_CONNECT_TYPE.WalletConnect,
    category: WALLET_BRAND_CATEGORY.MOBILE,
  },
  [WALLET_BRAND_TYPES.WalletConnect]: {
    id: 100,
    name: 'WalletConnect',
    brand: WALLET_BRAND_TYPES.WalletConnect,
    icon: IconWalletConnect,
    image: LogoWalletConnect,
    connectType: BRAND_WALLET_CONNECT_TYPE.WalletConnect,
    category: WALLET_BRAND_CATEGORY.MOBILE,
  },
  [WALLET_BRAND_TYPES.Binance]: {
    id: 101,
    name: 'Binance',
    brand: WALLET_BRAND_TYPES.Binance,
    icon: IconBinance,
    image: IconBinance,
    connectType: BRAND_WALLET_CONNECT_TYPE.Bundle,
    category: WALLET_BRAND_CATEGORY.INSTITUTIONAL,
  },
  [WALLET_BRAND_TYPES.Bitcoin]: {
    id: 102,
    name: 'BTC',
    brand: WALLET_BRAND_TYPES.Binance,
    icon: IconBitcoin,
    image: IconBitcoin,
    connectType: BRAND_WALLET_CONNECT_TYPE.Bundle,
    category: WALLET_BRAND_CATEGORY.INSTITUTIONAL,
  },
  [WALLET_BRAND_TYPES.OKX]: {
    id: 103,
    name: 'OKX',
    brand: WALLET_BRAND_TYPES.OKX,
    icon: IconOKX,
    image: IconOKX,
    connectType: BRAND_WALLET_CONNECT_TYPE.Bundle,
    category: WALLET_BRAND_CATEGORY.INSTITUTIONAL,
  },
  [WALLET_BRAND_TYPES.Rainbow]: {
    id: 21,
    name: 'Rainbow',
    brand: WALLET_BRAND_TYPES.Rainbow,
    icon: LogoRainbow,
    image: LogoRainbow,
    connectType: BRAND_WALLET_CONNECT_TYPE.WalletConnect,
    category: WALLET_BRAND_CATEGORY.MOBILE,
  },
  [WALLET_BRAND_TYPES.Bitkeep]: {
    id: 22,
    name: 'Bitget Wallet',
    brand: WALLET_BRAND_TYPES.Bitkeep,
    icon: LogoBitkeep,
    image: LogoBitkeep,
    connectType: BRAND_WALLET_CONNECT_TYPE.WalletConnect,
    category: WALLET_BRAND_CATEGORY.MOBILE,
  },
  [WALLET_BRAND_TYPES.Zerion]: {
    id: 23,
    name: 'Zerion Wallet',
    brand: WALLET_BRAND_TYPES.Zerion,
    icon: LogoZerion,
    image: LogoZerion,
    connectType: BRAND_WALLET_CONNECT_TYPE.WalletConnect,
    category: WALLET_BRAND_CATEGORY.MOBILE,
  },
  // [WALLET_BRAND_TYPES.Uniswap]: {
  //   id: 24,
  //   name: 'Uniswap Wallet',
  //   brand: WALLET_BRAND_TYPES.Uniswap,
  //   icon: LogoUniswap,
  //   image: LogoUniswap,
  //   connectType: BRAND_WALLET_CONNECT_TYPE.WalletConnect,
  //   category: WALLET_BRAND_CATEGORY.MOBILE,
  // },
  [WALLET_BRAND_TYPES.CoboArgus]: {
    id: 25,
    name: 'Cobo Argus',
    brand: WALLET_BRAND_TYPES.CoboArgus,
    icon: LogoCoboArgus,
    image: LogoCoboArgus,
    connectType: BRAND_WALLET_CONNECT_TYPE.CoboArgusConnect,
    category: WALLET_BRAND_CATEGORY.INSTITUTIONAL,
  },
  [WALLET_BRAND_TYPES.NGRAVEZERO]: {
    id: 26,
    name: 'NGRAVE ZERO',
    brand: WALLET_BRAND_TYPES.NGRAVEZERO,
    icon: LogoNgrave,
    image: LogoNgrave,
    connectType: BRAND_WALLET_CONNECT_TYPE.QRCodeBase,
    category: WALLET_BRAND_CATEGORY.HARDWARE,
  },
};

export const KEYRING_ICONS = {
  [KEYRING_CLASS.MNEMONIC]: IconMnemonicInk,
  [KEYRING_CLASS.PRIVATE_KEY]: IconPrivateKeyInk,
  [KEYRING_CLASS.WATCH]: IconWatchPurple,
  [HARDWARE_KEYRING_TYPES.BitBox02.type]: IconBitBox02,
  [HARDWARE_KEYRING_TYPES.Ledger.type]: LogoLedgerWhite,
  [HARDWARE_KEYRING_TYPES.Onekey.type]: LogoOnekey,
  [HARDWARE_KEYRING_TYPES.Trezor.type]: IconTrezor24,
  [HARDWARE_KEYRING_TYPES.GridPlus.type]: IconGridPlus,
};

export const KEYRING_ICONS_WHITE = {
  [KEYRING_CLASS.MNEMONIC]: IconMnemonicWhite,
  [KEYRING_CLASS.PRIVATE_KEY]: IconPrivateKeyWhite,
  [KEYRING_CLASS.WATCH]: IconWatchPurple,
  [HARDWARE_KEYRING_TYPES.BitBox02.type]: IconBitBox02,
  [HARDWARE_KEYRING_TYPES.Ledger.type]: LogoLedgerWhite,
  [HARDWARE_KEYRING_TYPES.Onekey.type]: LogoOnekey,
  [HARDWARE_KEYRING_TYPES.Trezor.type]: IconTrezor24,
  [HARDWARE_KEYRING_TYPES.GridPlus.type]: IconGridPlus,
};
export const KEYRING_PURPLE_LOGOS = {
  [KEYRING_CLASS.MNEMONIC]: IconMnemonicInk,
  [KEYRING_CLASS.PRIVATE_KEY]: IconPrivateKeyInk,
  [KEYRING_CLASS.WATCH]: IconWatchPurple,
};

export const KEYRINGS_LOGOS = {
  [KEYRING_CLASS.MNEMONIC]: LogoMnemonic,
  [KEYRING_CLASS.PRIVATE_KEY]: LogoPrivateKey,
  [KEYRING_CLASS.WATCH]: IconWatchPurple,
  [HARDWARE_KEYRING_TYPES.BitBox02.type]: IconBitBox02WithBorder,
  [HARDWARE_KEYRING_TYPES.Ledger.type]: LogoLedgerWhite,
  [HARDWARE_KEYRING_TYPES.Onekey.type]: IconOneKey18,
  [HARDWARE_KEYRING_TYPES.Trezor.type]: IconTrezor24Border,
  [HARDWARE_KEYRING_TYPES.GridPlus.type]: IconGridPlus,
};

export const NOT_CLOSE_UNFOCUS_LIST: string[] = [
  WALLET_BRAND_TYPES.AMBER,
  WALLET_BRAND_TYPES.COBO,
];

export const SPECIFIC_TEXT_BRAND = {
  [WALLET_BRAND_TYPES.JADE]: {
    i18nKey: 'WatchGuideStep2JADE',
  },
};

export const SORT_WEIGHT = {
  [KEYRING_TYPE.HdKeyring]: 1,
  [KEYRING_TYPE.SimpleKeyring]: 2,
  [KEYRING_TYPE.HardwareKeyring]: 3,
  [KEYRING_TYPE.WalletConnectKeyring]: 4,
  [KEYRING_TYPE.WatchAddressKeyring]: 5,
};

export const GASPRICE_RANGE = {
  [CHAINS_ENUM.ETH]: [0, 10000],
  [CHAINS_ENUM.BOBA]: [0, 1000],
  [CHAINS_ENUM.OP]: [0, 1000],
  [CHAINS_ENUM.ARBITRUM]: [0, 1000],
  [CHAINS_ENUM.AURORA]: [0, 1000],
  [CHAINS_ENUM.BSC]: [0, 1000],
  [CHAINS_ENUM.AVAX]: [0, 4000],
  [CHAINS_ENUM.POLYGON]: [0, 250000],
  [CHAINS_ENUM.FTM]: [0, 360000],
  [CHAINS_ENUM.GNOSIS]: [0, 500000],
  [CHAINS_ENUM.OKT]: [0, 15000],
  [CHAINS_ENUM.HECO]: [0, 50000],
  [CHAINS_ENUM.CELO]: [0, 100000],
  [CHAINS_ENUM.MOVR]: [0, 3000],
  [CHAINS_ENUM.CRO]: [0, 100000],
  [CHAINS_ENUM.BTT]: [0, 20000000000],
  [CHAINS_ENUM.METIS]: [0, 3000],
};

export const HDPaths = {
  [HARDWARE_KEYRING_TYPES.Ledger.type]: [
    { name: 'Ledger Live', value: "m/44'/60'/0'/0/0" },
    { name: 'Legacy (MEW / MyCrypto)', value: "m/44'/60'/0'" },
    { name: 'BIP44 Standard', value: "m/44'/60'/0'/0" },
  ],
};

export enum KEYRING_CATEGORY {
  Mnemonic = 'Mnemonic',
  PrivateKey = 'PrivateKey',
  WatchMode = 'WatchMode',
  Contract = 'Contract',
  Hardware = 'Hardware',
  WalletConnect = 'WalletConnect',
}

export const KEYRING_CATEGORY_MAP = {
  [KEYRING_CLASS.MNEMONIC]: KEYRING_CATEGORY.Mnemonic,
  [KEYRING_CLASS.PRIVATE_KEY]: KEYRING_CATEGORY.PrivateKey,
  [KEYRING_CLASS.WATCH]: KEYRING_CATEGORY.WatchMode,
  [KEYRING_CLASS.HARDWARE.LEDGER]: KEYRING_CATEGORY.Hardware,
  [KEYRING_CLASS.HARDWARE.ONEKEY]: KEYRING_CATEGORY.Hardware,
  [KEYRING_CLASS.HARDWARE.TREZOR]: KEYRING_CATEGORY.Hardware,
  [KEYRING_CLASS.HARDWARE.BITBOX02]: KEYRING_CATEGORY.Hardware,
  [KEYRING_CLASS.HARDWARE.KEYSTONE]: KEYRING_CATEGORY.Hardware,
  [KEYRING_CLASS.HARDWARE.GRIDPLUS]: KEYRING_CATEGORY.Hardware,
  [KEYRING_CLASS.WALLETCONNECT]: KEYRING_CATEGORY.WalletConnect,
  [KEYRING_CLASS.GNOSIS]: KEYRING_CATEGORY.Contract,
};

export const SWAP_FEE_PRECISION = 1e5;

export const DEFAULT_GAS_LIMIT_RATIO = 4;

export const SAFE_GAS_LIMIT_RATIO = {};
export const GAS_TOP_UP_ADDRESS = '0x7559e1bbe06e94aeed8000d5671ed424397d25b5';
export const GAS_TOP_UP_PAY_ADDRESS =
  '0x1f1f2bf8942861e6194fda1c0a9f13921c0cf117';

export const GAS_TOP_UP_SUPPORT_TOKENS: Record<string, string[]> = {
  arb: [
    '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
    '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
    '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
    'arb',
  ],
  astar: ['astar'],
  aurora: ['aurora'],
  avax: [
    '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7',
    '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
    '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
    '0xd586e7f844cea2f87f50152665bcbc2c279d8d70',
    'avax',
  ],
  boba: ['boba'],
  bsc: [
    '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3',
    '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
    '0x55d398326f99059ff775485246999027b3197955',
    '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
    '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
    '0xe9e7cea3dedca5984780bafc599bd69add087d56',
    'bsc',
  ],
  btt: ['btt'],
  canto: ['canto'],
  celo: ['celo'],
  cro: [
    '0x5c7f8a570d578ed84e63fdfa7b1ee72deae1ae23',
    '0x66e428c3f67a68878562e79a0234c1f83c208770',
    '0xc21223249ca28397b4b6541dffaecc539bff0c59',
    '0xf2001b145b43032aaf5ee2884e456ccd805f677d',
    'cro',
  ],
  dfk: ['dfk'],
  doge: ['doge'],
  eth: [
    '0x4fabb145d64652a948d72533023f6e7a623c7c53',
    '0x6b175474e89094c44da98b954eedeac495271d0f',
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    '0xdac17f958d2ee523a2206206994597c13d831ec7',
    'eth',
  ],
  evmos: ['evmos'],
  ftm: [
    '0x04068da6c83afcfa0e13ba15a6696662335d5b75',
    '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
    'ftm',
  ],
  fuse: ['fuse'],
  heco: ['heco'],
  hmy: ['hmy'],
  iotx: ['iotx'],
  kcc: ['kcc'],
  klay: ['klay'],
  matic: [
    '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
    '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
    '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
    '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    'matic',
  ],
  metis: ['metis'],
  mobm: ['mobm'],
  movr: ['movr'],
  nova: ['nova'],
  okt: ['okt'],
  op: [
    '0x7f5c764cbc14f9669b88837ca1490cca17c31607',
    '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58',
    '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
    'op',
  ],
  palm: ['palm'],
  rsk: ['rsk'],
  sbch: ['sbch'],
  sdn: ['sdn'],
  sgb: ['sgb'],
  swm: ['swm'],
  tlos: ['tlos'],
  wan: ['wan'],
  xdai: ['xdai'],
};

export const EXTERNAL_RESOURCE_DOMAIN_BLACK_LIST = ['5degrees.io'];

export const ALIAS_ADDRESS = {
  [GAS_TOP_UP_ADDRESS]: 'Gas Top Up',
  [GAS_TOP_UP_PAY_ADDRESS]: 'Gas Top Up',
};

// non-opstack L2 chains
export const L2_ENUMS = [
  CHAINS_ENUM.ARBITRUM,
  CHAINS_ENUM.AURORA,
  CHAINS_ENUM.NOVA,
  CHAINS_ENUM.BOBA,
  CHAINS_ENUM.MANTLE,
  CHAINS_ENUM.LINEA,
  CHAINS_ENUM.MANTA,
  CHAINS_ENUM.SCRL,
  CHAINS_ENUM.ERA,
  CHAINS_ENUM.PZE,
  CHAINS_ENUM.MANTA,
  CHAINS_ENUM.OP,
  CHAINS_ENUM.BASE,
  CHAINS_ENUM.ZORA,
  CHAINS_ENUM.OPBNB,
  CHAINS_ENUM.BLAST,
  CHAINS_ENUM.MODE,
  'DBK',
  'MINT',
  'CYBER',
];

// opstack L2 chains
export const OP_STACK_ENUMS = [
  CHAINS_ENUM.OP,
  CHAINS_ENUM.BASE,
  CHAINS_ENUM.ZORA,
  CHAINS_ENUM.OPBNB,
  CHAINS_ENUM.BLAST,
  CHAINS_ENUM.MODE,
  'DBK',
  'MINT',
  'CYBER',
];

export const ARB_LIKE_L2_CHAINS = [CHAINS_ENUM.ARBITRUM, CHAINS_ENUM.AURORA];

export const CAN_NOT_SPECIFY_INTRINSIC_GAS_CHAINS = [...L2_ENUMS];

export const CAN_ESTIMATE_L1_FEE_CHAINS = [
  ...OP_STACK_ENUMS,
  CHAINS_ENUM.SCRL,
  ...ARB_LIKE_L2_CHAINS,
  CHAINS_ENUM.PZE,
  CHAINS_ENUM.ERA,
  CHAINS_ENUM.LINEA,
];

export const WALLET_SORT_SCORE = [
  // mobile
  WALLET_BRAND_TYPES.METAMASK,
  WALLET_BRAND_TYPES.TRUSTWALLET,
  WALLET_BRAND_TYPES.TP,
  WALLET_BRAND_TYPES.IMTOKEN,
  WALLET_BRAND_TYPES.MATHWALLET,
  WALLET_BRAND_TYPES.Rainbow,
  WALLET_BRAND_TYPES.Bitkeep,
  WALLET_BRAND_TYPES.Zerion,
  // WALLET_BRAND_TYPES.Uniswap,
  WALLET_BRAND_TYPES.WalletConnect,
  // hardware wallet
  WALLET_BRAND_TYPES.LEDGER,
  WALLET_BRAND_TYPES.TREZOR,
  WALLET_BRAND_TYPES.GRIDPLUS,
  WALLET_BRAND_TYPES.ONEKEY,
  WALLET_BRAND_TYPES.KEYSTONE,
  WALLET_BRAND_TYPES.BITBOX02,
  WALLET_BRAND_TYPES.COOLWALLET,
  WALLET_BRAND_TYPES.AIRGAP,
  // institutional
  WALLET_BRAND_TYPES.GNOSIS,
  WALLET_BRAND_TYPES.FIREBLOCKS,
  WALLET_BRAND_TYPES.AMBER,
  WALLET_BRAND_TYPES.COBO,
  WALLET_BRAND_TYPES.JADE,
].reduce((pre, now, i) => {
  pre[now] = i + 1;
  return pre;
}, {} as { [k: string]: number });

declare global {
  interface Window {
    __is_rd__?: boolean;
  }
}

export const IS_RD = window.__is_rd__;

export enum CANCEL_TX_TYPE {
  QUICK_CANCEL = 'QUICK_CANCEL',
  ON_CHAIN_CANCEL = 'ON_CHAIN_CANCEL',
}

export const L2_DEPOSIT_ADDRESS_MAP: Record<string, string> = {
  [CHAINS_ENUM.ETH]: '0x205e94337bc61657b4b698046c3c2c5c1d2fb8f1',
  [CHAINS_ENUM.BSC]: '0x293391044c6981b6417fa0dcfd85524d4098a8d6',
  [CHAINS_ENUM.OP]: '0x824a2d0ae45c447caa8d0da4bb68a1a0056cadc6',
  [CHAINS_ENUM.ARBITRUM]: '0x40f480f247f3ad2ff4c1463e84f03be3a9a03e15',
  [CHAINS_ENUM.POLYGON]: '0xde74f4efdeec194c3f7b26be736bc8b5266ff7a5',
  [CHAINS_ENUM.BASE]: '0x16ac3457ce84e6c5f80b394c59ccb2fd17049a62',
  [CHAINS_ENUM.AVAX]: '0x16ac3457ce84e6c5f80b394c59ccb2fd17049a62',
};
