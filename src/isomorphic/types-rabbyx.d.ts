// type CHAINS_ENUM = import('@debank/common').CHAINS_ENUM;

type RabbyAccount = {
  address: string;
  type: string;
  brandName: string;
  alianName?: string;
};

type Account = RabbyAccount & {
  displayBrandName?: string;
  index?: number;
  balance?: number;
};

type RabbyEvent = {
  event: string;
  data?: any;
  origin?: string;
};

type IConnectedSiteInfo = {
  chain: import('@debank/common').CHAINS_ENUM;
  icon: string;
  isConnected: boolean;
  isSigned: boolean;
  isTop: boolean;
  name: string;
  origin: string;
};

interface ConnectedSite extends IConnectedSiteInfo {
  e?: number;
  order?: number;
}

interface GasCache {
  [chainId: string | number]: ChainGas;
}

interface ChainGas {
  gasPrice?: number | null; // custom cached gas price
  gasLevel?: string | null; // cached gasLevel
  lastTimeSelect?: 'gasLevel' | 'gasPrice'; // last time selection, 'gasLevel' | 'gasPrice'
}

interface AddedToken {
  [address: string]: string[];
}

interface PreferenceState {
  externalLinkAck: boolean;
  useLedgerLive: boolean;
  locale: string;
  isDefaultWallet: boolean;
  lastTimeSendToken: Record<string, /* TokenItem */ any>;
  walletSavedList: [];
  gasCache: GasCache;
  currentVersion: string;
  firstOpen: boolean;
  pinnedChain: string[];
  AddedToken: AddedToken;
  tokenApprovalChain: Record<string, import('@debank/common').CHAINS_ENUM>;
  nftApprovalChain: Record<string, import('@debank/common').CHAINS_ENUM>;
}

interface DisplayKeyring {
  unlock: () => Promise<void>;
  getFirstPage: () => Promise<string[]>;
  getNextPage: () => Promise<string[]>;
  getAccounts: () => Promise<string[]>;
  getAccountsWithBrand: () => Promise<Account[]>;
  activeAccounts: (indexes: number[]) => Promise<string[]>;
}

interface DisplayedKeyring {
  type: string;
  accounts: {
    address: string;
    brandName: string;
    type?: string;
    keyring?: DisplayKeyring;
    alianName?: string;
  }[];
  keyring: DisplayKeyring;
  byImport?: boolean;
}

type IHighlightedAddress = {
  brandName: Account['brandName'];
  address: Account['address'];
};
