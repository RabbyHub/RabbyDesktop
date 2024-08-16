import { Object as ObjectType } from 'ts-toolbelt';
import type {
  ExplainTxResponse,
  Tx,
  TotalBalanceResponse,
  TokenItem,
  Chain,
  TxPushType,
} from '@rabby-wallet/rabby-api/dist/types';

import type { DEX_ENUM } from '@rabby-wallet/rabby-swap';
import type { QuoteResult } from '@rabby-wallet/rabby-swap/dist/quote';
import { SafeTransactionDataPartial } from '@gnosis.pm/safe-core-sdk-types';
import type { DEX_TYPE, CEX_TYPE } from '@/renderer/routes/Swap/constant';
import { SafeTransactionItem } from '@rabby-wallet/gnosis-sdk/dist/api';
import { BasicSafeInfo } from '@rabby-wallet/gnosis-sdk';

export type RabbyAccount = {
  address: string;
  type: string;
  brandName: string;
  alianName?: string;
};

export type Account = RabbyAccount & {
  displayBrandName?: string;
  index?: number;
  balance?: number;
};

export interface GasCache {
  [chainId: string | number]: ChainGas;
}

export interface ChainGas {
  gasPrice?: number | null; // custom cached gas price
  gasLevel?: string | null; // cached gasLevel
  lastTimeSelect?: 'gasLevel' | 'gasPrice'; // last time selection, 'gasLevel' | 'gasPrice'
}

export interface AddedToken {
  [address: string]: string[];
}

export interface PreferenceState {
  externalLinkAck: boolean;
  useLedgerLive: boolean;
  locale: string;
  isDefaultWallet: boolean;
  lastTimeSendToken: Record<string, TokenItem>;
  walletSavedList: [];
  gasCache: GasCache;
  currentVersion: string;
  firstOpen: boolean;
  pinnedChain: string[];
  tokenApprovalChain: Record<string, import('@debank/common').CHAINS_ENUM>;
  nftApprovalChain: Record<string, import('@debank/common').CHAINS_ENUM>;
  customizedToken?: Token[];
  blockedToken?: Token[];
}
export interface Token {
  address: string;
  chain: string;
}

export interface DisplayKeyring {
  type: string;
  unlock: () => Promise<void>;
  getFirstPage: () => Promise<string[]>;
  getNextPage: () => Promise<string[]>;
  getAccounts: () => Promise<string[]>;
  getAccountsWithBrand: () => Promise<Account[]>;
  activeAccounts: (indexes: number[]) => Promise<string[]>;
}

export interface DisplayedKeyring {
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
  publicKey?: string;
}

export type IHighlightedAddress = {
  brandName: Account['brandName'];
  address: Account['address'];
};

export interface TransactionHistoryItem {
  rawTx: Tx;
  createdAt: number;
  isCompleted: boolean;
  hash: string;
  failed: boolean;
  gasUsed?: number;
  isSubmitFailed?: boolean;
  site?: ConnectedSite;

  pushType?: TxPushType;
  reqId?: string;
  isWithdrawed?: boolean;
}

interface TransactionSigningItem {
  rawTx: Tx;
  explain?: ObjectType.Merge<
    ExplainTxResponse,
    { approvalId: string; calcSuccess: boolean }
  >;
  id: string;
  isSubmitted?: boolean;
}

export interface TransactionDataItem {
  type: string | null;
  receives: {
    tokenId: string;
    from: string;
    token: TokenItem | undefined;
    amount: number;
  }[];
  sends: {
    tokenId: string;
    to: string;
    token: TokenItem | undefined;
    amount: number;
  }[];
  protocol: {
    name: string;
    logoUrl: string;
  } | null;
  id: string;
  chain: string;
  approve?: {
    token_id: string;
    value: number;
    token: TokenItem;
    spender: string;
  };
  status: 'failed' | 'pending' | 'completed' | 'finish';
  otherAddr: string;
  name: string | undefined;
  timeAt: number;
  rawTx?: Tx;
  txs?: TransactionHistoryItem[];
  site?: ConnectedSite;
  isScam?: boolean;
  group?: TransactionGroup;
}

export interface TransactionGroup {
  chainId: number;
  nonce: number;
  txs: TransactionHistoryItem[];
  isPending: boolean;
  createdAt: number;
  completedAt?: number;
  explain: ObjectType.Merge<
    ExplainTxResponse,
    { approvalId: string; calcSuccess: boolean }
  >;
  isFailed: boolean;
  isSubmitFailed?: boolean;
  dbIndexed: boolean;
  $ctx?: any;
}

export interface SwapState {
  gasPriceCache?: GasCache;
  selectedDex?: import('@rabby-wallet/rabby-swap').DEX_ENUM | null;
  selectedChain?: import('@debank/common').CHAINS_ENUM;
  unlimitedAllowance?: boolean;
  viewList: Record<keyof DEX_TYPE | keyof CEX_TYPE, boolean>;
  tradeList: Record<keyof DEX_TYPE | keyof CEX_TYPE, boolean>;
  sortIncludeGasFee: boolean;
  preferMEVGuarded: boolean;
}

type CHAINS_ENUM = import('@debank/common').CHAINS_ENUM;
type OpenApiService = import('@rabby-wallet/rabby-api').OpenApiService;
type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends (...args: any) => any ? K : never;
}[keyof T];
type FunctionProperties<T> = Pick<T, FunctionPropertyNames<T>>;
type OpenApiServiceFunc = FunctionProperties<OpenApiService>;
type GenOpenApiService<NS extends 'openapi' | 'testnetOpenapi'> = {
  [K in keyof OpenApiServiceFunc as `${NS}.${K}`]: OpenApiServiceFunc[K];
};

export interface RPCItem {
  url: string;
  enable: boolean;
}

export interface ContactBookItem {
  name: string;
  address: string;
  isAlias: boolean;
  isContact: boolean;
}

export interface SignTextHistoryItem {
  site: ConnectedSite;
  createAt: number;
  text: string;
  type:
    | 'personalSign'
    | 'ethSignTypedData'
    | 'ethSignTypedDataV1'
    | 'ethSignTypedDataV3'
    | 'ethSignTypedDataV4';
}

export type RabbyXMethod = {
  'walletController.requestETHRpc': (
    data: { method: string; params: any },
    chainId: string
  ) => any;
  'walletController.sendRequest': <T = any>(data: any) => T;
  'walletController.verifyPassword': (password: string) => void;
  'walletController.safeVerifyPassword': (password: string) => {
    success: true;
    error: null | Error;
  };
  'walletController.updatePassword': (
    oldPassword: string,
    newPassword: string
  ) => void;
  'walletController.changeAccount': (account: Account) => void;
  'walletController.getCurrentAccount': () => RabbyAccount;
  'walletController.syncGetCurrentAccount': () => RabbyAccount | null;
  'walletController.getAccounts': () => RabbyAccount[];
  'walletController.getAllClassAccounts': () => Promise<DisplayedKeyring[]>;

  'walletController.boot': (password: string) => void;
  'walletController.isBooted': () => boolean;
  'walletController.lockWallet': () => boolean;
  'walletController.isUnlocked': () => boolean;
  'walletController.unlock': (password: string) => void;

  'walletController.importPrivateKey': (data: string) => {
    address: string;
    type: string;
    brandName: string;
  }[];
  'walletController.markTransactionAsIndexed': (
    address: string,
    chainId: number,
    hash: string
  ) => void;
  'walletController.getTransactionHistory': (addr: string) => {
    pendings: TransactionGroup[];
    completeds: TransactionGroup[];
  };
  'walletController.updateAlianName': (addr: string, name: string) => void;
  'walletController.getAlianName': (addr: string) => string;

  'walletController.getSavedChains': () => CHAINS_ENUM[];
  'walletController.saveChain': (id: string) => void;
  'walletController.updateChain': (list: string[]) => CHAINS_ENUM[];

  'walletController.getConnectedSite': (key: string) => IConnectedSiteInfo;
  'walletController.topConnectedSite': (origin: string, order?: number) => void;
  'walletController.unpinConnectedSite': (origin: string) => void;
  'walletController.removeConnectedSite': (origin: string) => void;
  'walletController.getSitesByDefaultChain': (
    chain: IConnectedSiteInfo['chain']
  ) => void;
  'walletController.getConnectedSites': () => IConnectedSiteInfo[];
  'walletController.setRecentConnectedSites': (sites: ConnectedSite[]) => void;
  'walletController.getRecentConnectedSites': () => ConnectedSite[];
  'walletController.removeAllRecentConnectedSites': () => void;

  'walletController.setSite': (siteInfo: ConnectedSite) => void;
  'walletController.getSite': (origin: string) => ConnectedSite;
  'walletController.getCurrentSite': (
    tabId: number,
    domain: string
  ) => ConnectedSite | null;
  'walletController.getCurrentConnectedSite': (
    tabId: number,
    domain: string
  ) => ConnectedSite | null;

  'walletController.getPreference': (
    k?: keyof PreferenceState
  ) => typeof k extends void
    ? PreferenceState
    : PreferenceState[keyof PreferenceState];
  'walletController.addWatchAddressOnly': (address: string) => void;
  'walletController.importWatchAddress': (address: string) => RabbyAccount[];
  'walletController.getAddedToken': (address: string) => string[];
  'walletController.getAllVisibleAccounts': () => DisplayedKeyring[];
  'walletController.getAllAlianNameByMap': () => Record<string, any>;
  'walletController.getAddressBalance': (
    address: string,
    force?: boolean,
    isTestnet?: boolean
  ) => TotalBalanceResponse;
  'walletController.getAddressCacheBalance': (
    address: string,
    isTestnet?: boolean
  ) => TotalBalanceResponse | null;
  'walletController.getHighlightedAddresses': () => IHighlightedAddress[];
  'walletController.updateHighlightedAddresses': (
    list: IHighlightedAddress[]
  ) => void;
  'walletController.removeAddress': (
    address: string,
    type: string,
    brand?: string | undefined,
    isRemove?: boolean
  ) => void;
  'walletController.getContactsByMap': () => Record<string, ContactBookItem>;
  'walletController.getWhitelist': () => string[];
  'walletController.setWhitelist': (addresses: string[]) => Promise<void>;
  'walletController.addWhitelist': (addresses: string) => Promise<void>;
  'walletController.toggleWhitelist': (enable: boolean) => Promise<void>;

  'walletController.isWhitelistEnabled': () => boolean;
  'walletController.setLastTimeSendToken': (
    address: string,
    token: TokenItem
  ) => void;
  'walletController.getLastTimeGasSelection': (
    id: keyof GasCache
  ) => ChainGas | null;
  'walletController.getLastTimeSendToken': (address: string) => TokenItem;
  'walletController.getSwap': (
    k?: keyof SwapState
  ) => typeof k extends void ? SwapState : SwapState[keyof SwapState];

  'walletController.getSwapGasCache': (
    chainId: keyof GasCache
  ) => ChainGas | null;

  'walletController.updateSwapGasCache': (
    chainId: keyof GasCache,
    gas: ChainGas
  ) => void;

  'walletController.getSwapSortIncludeGasFee': () => boolean | undefined;
  'walletController.setSwapSortIncludeGasFee': (includesGas: boolean) => void;

  'walletController.setSwapDexId': (dexId: DEX_ENUM) => void;

  'walletController.setLastSelectedSwapChain': (dexId: CHAINS_ENUM) => void;

  'walletController.setUnlimitedAllowance': (bool: boolean) => void;

  'walletController.setSwapView': (
    id: keyof SwapState['viewList'],
    bool: boolean
  ) => void;

  'walletController.setSwapTrade': (
    id: keyof SwapState['tradeList'],
    bool: boolean
  ) => void;

  'walletController.getSwapViewList': () => SwapState['viewList'];

  'walletController.getSwapTradeList': () => SwapState['tradeList'];
  'walletController.getSwapPreferMEVGuarded': () => boolean;
  'walletController.setSwapPreferMEVGuarded': (bool: boolean) => boolean;

  'walletController.getERC20Allowance': (
    chainServerId: string,
    erc20Address: string,
    contractAddress: string
  ) => Promise<string>;

  'walletController.getRecommendNonce': (p: {
    from: string;
    chainId: number;
  }) => Promise<string>;

  'walletController.generateApproveTokenTx': (p: {
    from: string;
    to: string;
    chainId: number;
    spender: string;
    amount: string;
  }) => {
    from: string;
    to: string;
    chainId: number;
    value: string;
    data: string;
  };

  'walletController.dexSwap': (
    p: {
      swapPreferMEVGuarded: boolean;
      chain: CHAINS_ENUM;
      quote: QuoteResult;
      needApprove: boolean;
      spender: string;
      pay_token_id: string;
      unlimited: boolean;
      gasPrice?: number;
      shouldTwoStepApprove: boolean;
    },
    $ctx?: unknown
  ) => Promise<void | string>;
  'walletController.requestKeyring': (
    type: string,
    methodName: string,
    keyringId: number | null,
    ...params: any[]
  ) => any;
  'walletController.connectHardware': ({
    type,
    hdPath,
    needUnlock,
    isWebHID,
  }: {
    type: string;
    hdPath?: string | undefined;
    needUnlock?: boolean | undefined;
    isWebHID?: boolean | undefined;
  }) => number | null;
  'walletController.unlockHardwareAccount': (
    keyring: string,
    indexes: number[],
    keyringId: number | null
  ) => Account;

  'walletController.initWalletConnect': (
    brandName: string,
    curStashId: number | null,
    chainId?: number
  ) => {
    uri: string;
    stashId: number | null;
  };
  'walletController.importWalletConnect': (
    address: string,
    brandName: string,
    bridge?: string,
    stashId?: number,
    realBrandName?: string,
    realBrandUrl?: string
  ) => Account[];
  'walletController.updateAddressBalanceCache': (
    address: string,
    balance: string
  ) => void;
  'walletController.rejectAllApprovals': () => void;

  // Mint Rabby
  'walletController.mintedRabbyEndDateTime': () => number;
  'walletController.mintRabby': () => string;
  'walletController.getMintedRabby': () =>
    | false
    | {
        tokenId: string;
        contractAddress: string;
        detailUrl: string;
        isOwner?: boolean;
      };
  'walletController.mintedRabbyTotal': () => number;

  'walletController.clearAddressPendingTransactions': (address: string) => void;
  'walletController.importGnosisAddress': (
    address: string,
    networkIds: string[]
  ) => RabbyAccount[];
  'walletController.fetchGnosisChainList': (address: string) => Chain[];
  'walletController.getTypedAccounts': () => DisplayedKeyring[];
  'walletController.syncGnosisNetworks': (address: string) => void;
  'walletController.getGnosisOwners': (
    account: Account,
    safeAddress: string,
    version: string,
    networkId: string
  ) => string[];
  'walletController.getGnosisNetworkId': (address: string) => string;
  'walletController.getGnosisNetworkIds': (address: string) => string[];
  'walletController.getGnosisAllPendingTxs': (address: string) => {
    total: number;
    results: {
      networkId: string;
      txs: SafeTransactionItem[];
    }[];
  } | null;
  'walletController.validateGnosisTransaction': (
    {
      account,
      tx,
      version,
      networkId,
    }: {
      account: Account;
      tx: any;
      version: string;
      networkId: string;
    },
    hash: string
  ) => boolean;
  'walletController.buildGnosisTransaction': (
    safeAddress: string,
    account: Account,
    tx: any,
    version: string,
    networkId: string
  ) => void;
  'walletController.getGnosisTransactionHash': () => string;
  'walletController.validateSafeConfirmation': (
    txHash: string,
    signature: string,
    ownerAddress: string,
    type: string,
    version: string,
    safeAddress: string,
    tx: SafeTransactionDataPartial,
    networkId: number,
    owners: string[]
  ) => boolean;
  'walletController.setGnosisTransactionHash': (hash: string) => void;
  'walletController.gnosisAddPureSignature': (
    owner: string,
    signature: string
  ) => void;
  'walletController.getAllVisibleAccountsArray': () => RabbyAccount[];
  'walletController.execGnosisTransaction': (
    account: IDisplayedAccountWithBalance
  ) => void;
  'walletController.getBasicSafeInfo': (params: {
    networkId: string;
    address: string;
  }) => BasicSafeInfo;

  'walletController.setCustomRPC': (chain: CHAINS_ENUM, url: string) => void;
  'walletController.removeCustomRPC': (chain: CHAINS_ENUM) => void;
  'walletController.getAllCustomRPC': () => Record<string, RPCItem>;
  'walletController.getCustomRpcByChain': (chain: CHAINS_ENUM) => RPCItem;
  'walletController.pingCustomRPC': (chain: CHAINS_ENUM) => boolean;
  'walletController.setRPCEnable': (
    chain: CHAINS_ENUM,
    enable: boolean
  ) => void;
  'walletController.validateRPC': (url: string, chainId: number) => boolean;

  'permissionService.addConnectedSite': (
    origin: string,
    name: string,
    icon: string,
    defaultChain: CHAINS_ENUM,
    isSigned?: boolean
  ) => void;
  'permissionService.updateConnectSite': (
    origin: string,
    value: Partial<ConnectedSite>,
    partialUpdate?: boolean
  ) => void;
  'permissionService.getConnectedSite': (
    origin: string
  ) => ConnectedSite | void;
  'permissionService.removeConnectedSite': (origin: string) => void;

  'sessionService.broadcastEvent': (
    ev: string,
    data?: any,
    origin?: string
  ) => void;
  'sessionService.broadcastToDesktopOnly': (
    ev: string,
    data?: any,
    origin?: string
  ) => void;

  'walletController.getEnsContentHash': (name: string) => string;
  'walletController.getWalletConnectSessionStatus': (
    address: string,
    brandName: string
  ) => WalletConnectSessionStatus;
  'walletController.getCommonWalletConnectInfo': (
    address: string
  ) => Account & {
    realBrandName?: string;
  };
  'walletController.killWalletConnectConnector': (
    address: string,
    brandName: string,
    resetConnect: boolean,
    silent?: boolean
  ) => void;
  'walletController.gridPlusIsConnect': () => boolean;
  'walletController.isUseLedgerLive': () => boolean;
  'walletController.transferNFT': (
    {
      to,
      chainServerId,
      contractId,
      abi,
      tokenId,
      amount,
    }: {
      to: string;
      chainServerId: string;
      contractId: string;
      abi: 'ERC721' | 'ERC1155';
      tokenId: string;
      amount?: number | undefined;
    },
    $ctx?: any
  ) => Promise<void>;
  'walletController.getCollectionStarred': () => Token[];
  'walletController.addCollectionStarred': (token: Token) => void;
  'walletController.removeCollectionStarred': (token: Token) => void;
  'walletController.revoke': (input: {
    list: import('@/isomorphic/approve').ApprovalSpenderItemToBeRevoked[];
  }) => void;
  'walletController.submitQRHardwareCryptoHDKey': (
    cbor: string,
    keyringId?: number | null
  ) => number | null;
  'walletController.submitQRHardwareCryptoAccount': (
    cbor: string,
    keyringId?: number | null
  ) => number | null;
  'walletController.checkQRHardwareAllowImport': (brand: string) => {
    allowed: boolean;
    brand: string;
  };
  'walletController.initQRHardware': (brand: string) => number | null;
  'walletController.addCustomizedToken': (token: Token) => void;
  'walletController.removeCustomizedToken': (token: Token) => void;
  'walletController.getCustomizedToken': () => Token[];
  'walletController.addBlockedToken': (token: Token) => void;
  'walletController.removeBlockedToken': (token: Token) => void;
  'walletController.getBlockedToken': () => Token[];
  'walletController.getIsShowTestnet': () => boolean;
  'walletController.setIsShowTestnet': (value: boolean) => void;
  'walletController.getSignTextHistory': (
    address: string
  ) => SignTextHistoryItem[];
  'walletController.loadPendingListQueue': (
    address: string
  ) => TransactionGroup[];
  'walletController.retryPushTx': (params: {
    address: string;
    chainId: number;
    nonce: number;
    reqId: string;
  }) => void;
  'walletController.getSkipedTxs': (
    address: string
  ) => Record<string, TransactionGroup[]>;
  'walletController.quickCancelTx': (params: {
    address: string;
    chainId: number;
    nonce: number;
    reqId: string;
  }) => void;
  'walletController.getMainnetListFromLocal': () => Chain[];
} & GenOpenApiService<'openapi'> &
  GenOpenApiService<'testnetOpenapi'>;

export type RabbyXMethods = {
  [K in keyof RabbyXMethod]: (
    ...args: Parameters<RabbyXMethod[K]>
  ) => Promise<ReturnType<RabbyXMethod[K]>>;
};

// extract `walletController.` from keyof walletController.
export type RabbyXContollerNS = ExtractNS<keyof RabbyXMethods>;

export type RabbyXContollerMeththodNames = {
  [P in RabbyXContollerNS]: ExtractMember<keyof RabbyXMethods, P> & string;
};

type GetRabbyXMethods<
  NS extends RabbyXContollerNS,
  METHOD extends RabbyXContollerMeththodNames[NS]
> = {
  [K in keyof RabbyXMethods]: K extends `${NS}.${METHOD}`
    ? RabbyXMethods[K]
    : never;
}[keyof RabbyXMethods];

export type RabbyXContollerMethods = {
  [P in RabbyXContollerNS]: {
    [K in RabbyXContollerMeththodNames[P]]: GetRabbyXMethods<P, K>;
  };
};
