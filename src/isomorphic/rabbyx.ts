export type RabbyXMethod = {
  'walletController.isBooted': () => boolean;
  'walletController.isUnlocked': () => boolean;
  'walletController.unlock': (password: string) => void;

  'walletController.getConnectedSites': () => IConnectedSiteInfo[];
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
