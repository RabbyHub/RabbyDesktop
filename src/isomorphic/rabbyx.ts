// eslint-disable-next-line @typescript-eslint/naming-convention
type CHAINS_ENUM = import('@debank/common').CHAINS_ENUM;

export type RabbyXMethod = {
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

export type RabbyXContollerMethods = {
  [P in RabbyXContollerNS]: {
    [K in RabbyXContollerMeththodNames[P]]: RabbyXMethods[`${P}.${K}`];
  };
};

export type RabbyXContollerMethodsPromise = {
  [P in RabbyXContollerNS]: {
    [K in RabbyXContollerMeththodNames[P]]: RabbyXMethods[`${P}.${K}`];
  };
};
