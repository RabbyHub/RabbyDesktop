// eslint-disable-next-line @typescript-eslint/naming-convention
import type { TotalBalanceResponse } from '@debank/rabby-api/dist/types';

type CHAINS_ENUM = import('@debank/common').CHAINS_ENUM;
type OpenApiService = import('@debank/rabby-api').OpenApiService;

export type RabbyXMethod = {
  'walletController.verifyPassword': (password: string) => void;
  'walletController.changeAccount': (account: Account) => void;
  'walletController.getCurrentAccount': () => RabbyAccount;
  'walletController.syncGetCurrentAccount': () => RabbyAccount | null;
  'walletController.getAccounts': () => RabbyAccount[];

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

  'walletController.importWatchAddress': (address: string) => RabbyAccount[];

  'walletController.getAllVisibleAccounts': () => DisplayedKeyring[];
  'walletController.getAllAlianNameByMap': () => Record<string, any>;
  'walletController.getAddressBalance': (
    address: string
  ) => TotalBalanceResponse;
  'walletController.getAddressCacheBalance': (
    address: string
  ) => TotalBalanceResponse | null;
  'walletController.getHighlightedAddresses': () => IHighlightedAddress[];
  'walletController.updateHighlightedAddresses': (
    list: IHighlightedAddress[]
  ) => void;
  'walletController.removeAddress': (
    address: string,
    type: string,
    brand?: string | undefined
  ) => void;
  'walletController.getWhitelist': () => string[];
  'walletController.isWhitelistEnabled': () => boolean;

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
} & {
  'openapi.setHost': OpenApiService['setHost'];
  'openapi.getHost': OpenApiService['getHost'];
  'openapi.ethRpc': OpenApiService['ethRpc'];
  'openapi.init': OpenApiService['init'];
  'openapi.getRecommendChains': OpenApiService['getRecommendChains'];
  'openapi.getTotalBalance': OpenApiService['getTotalBalance'];
  'openapi.getPendingCount': OpenApiService['getPendingCount'];
  'openapi.checkOrigin': OpenApiService['checkOrigin'];
  'openapi.checkText': OpenApiService['checkText'];
  'openapi.checkTx': OpenApiService['checkTx'];
  'openapi.preExecTx': OpenApiService['preExecTx'];
  'openapi.historyGasUsed': OpenApiService['historyGasUsed'];
  'openapi.pendingTxList': OpenApiService['pendingTxList'];
  'openapi.traceTx': OpenApiService['traceTx'];
  'openapi.pushTx': OpenApiService['pushTx'];
  'openapi.explainText': OpenApiService['explainText'];
  'openapi.gasMarket': OpenApiService['gasMarket'];
  'openapi.getTx': OpenApiService['getTx'];
  'openapi.getEnsAddressByName': OpenApiService['getEnsAddressByName'];
  'openapi.searchToken': OpenApiService['searchToken'];
  'openapi.searchSwapToken': OpenApiService['searchSwapToken'];
  'openapi.getToken': OpenApiService['getToken'];
  'openapi.listToken': OpenApiService['listToken'];
  'openapi.customListToken': OpenApiService['customListToken'];
  'openapi.listChainAssets': OpenApiService['listChainAssets'];
  'openapi.listNFT': OpenApiService['listNFT'];
  'openapi.listCollection': OpenApiService['listCollection'];
  'openapi.listTxHisotry': OpenApiService['listTxHisotry'];
  'openapi.tokenPrice': OpenApiService['tokenPrice'];
  'openapi.tokenAuthorizedList': OpenApiService['tokenAuthorizedList'];
  'openapi.userNFTAuthorizedList': OpenApiService['userNFTAuthorizedList'];
  'openapi.getDEXList': OpenApiService['getDEXList'];
  'openapi.getSwapQuote': OpenApiService['getSwapQuote'];
  'openapi.getSwapTokenList': OpenApiService['getSwapTokenList'];
  'openapi.postGasStationOrder': OpenApiService['postGasStationOrder'];
  'openapi.getGasStationChainBalance': OpenApiService['getGasStationChainBalance'];
  'openapi.getGasStationTokenList': OpenApiService['getGasStationTokenList'];
  'openapi.explainTypedData': OpenApiService['explainTypedData'];
  'openapi.checkTypedData': OpenApiService['checkTypedData'];
  'openapi.approvalStatus': OpenApiService['approvalStatus'];
  'openapi.usedChainList': OpenApiService['usedChainList'];
  'openapi.getLatestVersion': OpenApiService['getLatestVersion'];
  'openapi.addOriginFeedback': OpenApiService['addOriginFeedback'];
  'openapi.getNetCurve': OpenApiService['getNetCurve'];
  'openapi.getTokenHistoryPrice': OpenApiService['getTokenHistoryPrice'];
  'openapi.getHistoryTokenList': OpenApiService['getHistoryTokenList'];
  'openapi.getProtocolList': OpenApiService['getProtocolList'];
  'openapi.getProtocol': OpenApiService['getProtocol'];
  'openapi.getHistoryProtocol': OpenApiService['getHistoryProtocol'];
};

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
