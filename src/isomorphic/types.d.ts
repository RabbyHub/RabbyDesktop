/* from builder-util-runtime/out/ProgressCallbackTransform.d.ts */
type IAppVersions = {
  version: ReturnType<Electron.App['getVersion']>;
  appChannel: 'reg' | 'prod';
  gitRef: string;
};

interface ProgressInfo {
  total: number;
  delta: number;
  transferred: number;
  percent: number;
  bytesPerSecond: number;
}

type RabbyEvent = {
  event: string;
  data?: any;
  origin?: string;
};

type DappViewRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type IMainWindowActiveTabRect =
  | {
      dappViewState: 'mounted';
      rect: DappViewRect;
    }
  | {
      dappViewState: 'unmounted';
      rect?: null | DappViewRect;
    };

type IPreviewDappViewChanges =
  | {
      dappViewState: 'mounted';
      dappURL: string;
      rect: DappViewRect;
    }
  | {
      dappViewState: 'unmounted';
      rect?: null | DappViewRect;
    };

type IDappAddSource = 'https' | 'ipfs-cid' | 'ens-addr' | 'localfs';

type INextDapp = {
  id: string;
  alias: string;
  extraInfo?: {
    ipfsCid?: string;
    ensAddr?: string;
    dappAddSource?: IDappAddSource;
    localPath?: string;
  };
  faviconUrl?: string;
  faviconBase64?: string;
} & (
  | {
      type: 'unknown';
      origin: string;
    }
  | {
      type: 'http';
      origin: string | `https://${string}${string}`;
    }
  | {
      type: 'ipfs';
      origin: string | `rabby-ipfs://${string}${string}`;
    }
  | {
      type: 'ens';
      origin: string | `rabby-ens://${string}${string}`;
    }
  | {
      type: 'localfs';
      origin: string | `rabby-fs://${string}${string}`;
    }
);

type IDappType = INextDapp['type'];
type IValidDappType = Exclude<INextDapp['type'], 'unknown'>;

type IDappPartial = Omit<INextDapp, 'id' | 'type'> & {
  id?: INextDapp['id'];
  type?: INextDapp['type'];
};

type ICheckedOutDappURL = {
  inputURL: string;
  type: INextDapp['type'];
  dappID: string;
  dappOrigin: string;
  /** @description this is also used as `dappTabID` */
  dappHttpID: string;
  dappOriginToShow: string;
  dappURLToPrview: string;
  ipfsCid: string;
  ensAddr: string;

  /** @description only useful for dapp with type 'localfs' */
  localFSID: string;
  localFSPath: string;

  pathnameWithQuery: string;
};

type IHttpDapp = INextDapp & { type: 'http' };

type IHttpTypeDappVersion = {
  versionSha512: string;
  timestamp: number;
  /* should not used in production */
  __cssTagsStringOnDev?: string;
};

type IDetectHttpTypeDappVersionResult = {
  updated: boolean;
  latest?: null | IHttpTypeDappVersion;
  versionQueue: IHttpTypeDappVersion[];
};

/**
 * @description alias of http type dapp
 */
type IDapp = INextDapp;

type IDappWithDomainMeta = IDapp & {
  // only dapp with second domain has this property
  secondDomainMeta?: I2ndDomainMeta;
};

type IMergedDapp = IDappWithDomainMeta & {
  isPinned: boolean;
};

type I2ndDomainMeta = {
  is2ndaryDomain: boolean;
  secondaryDomain: string;
  secondaryDomainOriginExisted: boolean;
  origin: string;
  subDomains: string[];
};

type IDappWithTabInfo = IMergedDapp & {
  tab?: chrome.tabs.Tab;
};

type IDesktopAppState = {
  firstStartApp: boolean;
  enableContentProtected: boolean;
  enableServeDappByHttp: boolean;
  sidebarCollapsed: boolean;

  tipedHideMainWindowOnWindows: boolean;

  experimentalDappViewZoomPercent: number;

  selectedMediaConstrains: {
    label: string | null;
  } | null;
};

type IAppDynamicConfig = {
  domain_metas?: {
    url_head?: {
      [key: string]: {
        alias?: string;
        navTextColorLight?: string;
        navBgColorLight?: string;
        navBgColorDark?: string;
        faviconURL?: string;
        shouldSimulateBrowser?: boolean;
      };
    };
  };
  blockchain_explorers?: string[];
  special_main_domains?: {
    ids?: string[];
  };
  app_update?: {
    force_update?: string[];
  };
};

type IProxySettings = {
  protocol: 'socks5' | 'http';
  hostname: string;
  port: number;
  username?: string;
  password?: string;
};
type IAppProxyConf = {
  proxyType: 'none' | 'system' | 'custom';
  proxySettings: IProxySettings;
  // it can be used as axios's config property directly
  systemProxySettings?: {
    protocol: 'http';
    host: string;
    port: number;
  };
};
type IPraticalAppProxyConf = IAppProxyConf & {
  configForAxios: IAppProxyConf['systemProxySettings'];
};

type IRunningAppProxyConf = IAppProxyConf & { applied: boolean };

type ISensitiveConfig = {
  enableContentProtected: boolean;
} & IAppProxyConf;

type IDappsDetectResult<T extends string = string> = {
  data: null | {
    preparedDappId?: string;
    finalOrigin: string;
    isFinalExistedDapp?: boolean;
    inputOrigin: string;
    isInputExistedDapp?: boolean;
    recommendedAlias: string;
    icon: import('@debank/parse-favicon').Icon | null;
    faviconUrl?: string;
    faviconBase64?: string; // base64
  };
  error?: {
    type: T;
    message?: string;
  };
};

type IAppUpdatorCheckResult =
  | {
      hasNewRelease: true;
      releaseVersion: string;
      releaseNote: string;
    }
  | {
      hasNewRelease: false;
      releaseVersion: null;
      releaseNote: null;
    };

type IAppUpdatorProcessStep = 'wait' | 'process' | 'finish' | 'error';
type IAppUpdatorDownloadProgress =
  | {
      progress: ProgressInfo;
      isEnd: false;
    }
  | {
      progress: null;
      isEnd: true;
      downloadFailed?: boolean;
    };

type HexValue = `0x${number}`;

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

type IConnectedSiteToDisplay = {
  origin: IConnectedSiteInfo['origin'];
  isConnected: IConnectedSiteInfo['isConnected'];
  chain: IConnectedSiteInfo['chain'];
  chainHex: import('@debank/common').Chain['hex'];
  chainName: string;
};

type IDappUpdateDetectionItem = {
  dapp_id: string;
  version: string;
  is_changed: boolean;
  new_detected_address_list: string[];
  create_at: number;
};

type ISecurityCheckResult = {
  origin: string;
  countWarnings: number;
  countIssues: number;
  countDangerIssues: number;
  resultLevel: 'ok' | 'warning' | 'danger';
  timeout: boolean;
  checkHttps: {
    level: ISecurityCheckResult['resultLevel'];
    timeout?: boolean;
    httpsError: boolean;
    chromeErrorCode?: string;
  };
  checkLatestUpdate: {
    level: ISecurityCheckResult['resultLevel'];
    timeout?: boolean;
    latestChangedItemIn24Hr?: IDappUpdateDetectionItem | null;
    latestItem?: IDappUpdateDetectionItem | null;
    error?: string;
  };
};

type ISecurityNotificationPayload =
  | {
      type: 'full-web3-addr';
      web3Addr: string;
    }
  | {
      type: 'full-web3-addr-changed' | 'full-web3-addr-quick-changed';
      prevAddr: string;
      curAddr: string;
    }
  | {
      type: 'text-with-ens';
      ensDomain: string;
    };

type IFocusedDetailedType = 'checkHttps' | 'checkLatestUpdate';
type ISecurityAddrbarPopupState =
  | {
      page: 'entry';
    }
  | {
      page: 'detail-item';
      focusingItem: IFocusedDetailedType;
    };

type IRabbyxRpcQuery = {
  rpcId: string;
  method: string;
  params: any[];
};

type IRabbyxRpcResponse = {
  rpcId: string;
  result: any | null;
  error?: Error;
};

type IHardwareConnectPageType = 'onekey' | 'trezor';
type IPopupWinPageInfo =
  | {
      type: 'sidebar-dapp-contextmenu';
      dappTabInfo: {
        dappID: string;
        dappOrigin: string;
        dappType: INextDapp['type'];
        id: chrome.tabs.Tab['id'];
        url?: string;
      };
    }
  | {
      type: 'top-ghost-window';
    };

type ISelectDeviceState = {
  selectId: string;
} & (
  | {
      status: 'pending';
    }
  | {
      status: 'selected';
      deviceInfo: {
        vendorId: IHidDevice['vendorId'];
        productId: IHidDevice['productId'];
        deviceId?: IHidDevice['deviceId'];
        name?: IHidDevice['name'];
      };
    }
  | {
      status: 'rejected';
    }
);

type ISelectCameraState = {
  selectId: string;
} & (
  | {
      status: 'pending';
    }
  | {
      status: 'selected';
      deviceInfo: MediaDeviceInfo;
    }
  | {
      status: 'rejected';
    }
);

type IWebviewPerfInfo = {
  time: number;
  memoryInfo: {
    totalJSHeapSize: number;
    usedJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
};

type IEventEmitterListenerReport = {
  total: number;
  events: Record<string, number>;
};

type PopupViewOnMainwinInfo =
  | {
      type: 'dapps-management';
      state?: {
        newDappOrigin?: string;
      };
    }
  | {
      type: 'select-devices';
      state: ISelectDeviceState;
    }
  | {
      type: 'select-camera';
      state: ISelectCameraState;
    }
  | {
      type: 'z-popup';
    }
  | {
      type: 'global-toast-popup';
      state?: {
        toastType: 'toast-message';
        rectTopOffset?: number;
        data: {
          type: 'success' | 'error' | 'warning';
          content?: string;
          duration?: number;
        };
      };
    }
  | {
      type: 'in-dapp-find';
      searchInfo?: {
        tabId: number;
        tabOrigin: { x: number; y: number };
      };
    }
  | {
      type: 'right-side-popup';
      state: {
        type: 'success' | 'submit' | 'failed';
        chain: CHAINS_ENUM;
        hash?: string;
        title: string;
      };
    };

type PickPopupViewPageInfo<T extends PopupViewOnMainwinInfo['type']> =
  PopupViewOnMainwinInfo & { type: T };

type IDebugStates = {
  isGhostWindowDebugHighlighted: boolean;
};

type IShellNavInfo = {
  tabExists: boolean;
  canGoForward?: boolean;
  canGoBack?: boolean;
  tabUrl: string;
  dapp?: IDapp;
  dappSecurityCheckResult: ISecurityCheckResult | null;
};

type INodeHidDeviceInfo = import('node-hid').Device;

type IUSBDevice = PickAllNonFnFields<USBDevice>;
type INodeWebUSBDevice = PickAllNonFnFields<import('usb').WebUSBDevice>;
type IHidDevice = Electron.HIDDevice;

type IMergedHidDevice = IHidDevice & {
  nodeDevice?: INodeHidDeviceInfo | null;
};

type IOSInfo = {
  arch: typeof process.arch;
  platform: typeof process.platform;
};
type IProtocolDappBindings = Record<
  string,
  { origin: string; siteUrl: string }
>;

type IDappBoundTabIds = Record<IDapp['id'], number>;

type IBuiltinViewName =
  | PopupViewOnMainwinInfo['type']
  | IPopupWinPageInfo['type']
  | 'main-window';

type INonSameDomainAction = {
  url: string;
  sourceURL: string;
  // toExistedDapp: boolean;
  status: 'start-loading' | 'loaded';
  favIcon: IParsedFavicon | null;
};

type IParsedFavicon = {
  iconInfo: import('@debank/parse-favicon').Icon | null;
  faviconUrl?: string;
  faviconBase64?: string;
};

type IPopupViewChanges<
  T extends PopupViewOnMainwinInfo['type'] = PopupViewOnMainwinInfo['type']
> =
  | {
      type: T;
      visible: true;
      pageInfo: PopupViewOnMainwinInfo & { type: T };
    }
  | {
      type: T;
      visible: false;
    };

type IDappLastOpenInfo = {
  finalURL: string;
};

type IRabbyxInfo = {
  rabbyxExtId: string;
  userId?: string;
  requesterIsRabbyx: boolean;
};

type ISafeOpenDappTabResult = {
  shouldNavTabOnClient: boolean;
  openType?: 'alert-user' | 'switch-to-opened-tab' | 'create-tab';
  isOpenExternal: boolean;
  isTargetDapp?: boolean;
  isTargetDappByOrigin?: boolean;
  isTargetDappBySecondaryOrigin?: boolean;
};

type IParseDomainInfo = {
  subDomain: string;
  hostWithoutTLD: string;
  tld: string;
  secondaryDomain: string;
  secondaryOrigin: string;
  is2ndaryDomain: boolean;
  isWWWSubDomain: boolean;
  isSubDomain: boolean;
};

type ICanonalizedUrlInfo = {
  urlInfo: Partial<URL> | null;
  isDapp: boolean;
  origin: string;
  hostname: string;
  fullDomain: string;
} & IParseDomainInfo;

type IShellWebUIType =
  | 'MainWindow'
  | 'Prompt'
  | 'ForTrezorLike'
  | 'RabbyX-NotificationWindow';

type IOpenDappAction =
  | 'open-in-newtab'
  | 'leave-in-tab'
  | 'open-external'
  | 'deny';

type IMatchDappResult = {
  dappByOrigin: null | IDapp;
  dappBySecondaryDomainOrigin: null | IDapp;
  dapp: null | IDapp;
};

type ISiteMetaData = {
  title: string;
  twitter_card: {
    card?: string;
    site?: string;
    creator?: string;
    creator_id?: string;
    title?: string;
    description?: string;
    image?: string;
  };
  og: {
    title?: string;
    site_name?: string;
    image?: string;
  };
  linkRelIcons: {
    href: string;
    sizes: string;
  }[];
  favicons: {
    href: string;
    sizes: string;
  }[];
};

type IAppSession = {
  mainSession: Electron.Session;
  dappSafeViewSession: Electron.Session;
  checkingViewSession: Electron.Session;
  checkingProxySession: Electron.Session;
};

type ITrezorLikeCannotUserReason =
  | {
      reasonType: 'used-one';
      haveUsed: IHardwareConnectPageType;
      cannotUse: IHardwareConnectPageType;
    }
  | {
      reasonType: 'enabled-ipfs';
      cannotUse: IHardwareConnectPageType;
    };
// --------- BUNDLE -----------
interface CommonBundleAccount {
  id?: string;
  type: 'bn' | 'btc' | 'eth' | 'okx';
  nickname: string;
  balance?: string;
  inBundle?: boolean;
}

interface CommonCexAccount extends CommonBundleAccount {
  apiKey: string;
  apiSecret: string;
}
interface BNAccount extends CommonCexAccount {
  type: 'bn';
}

interface OkxAccount extends CommonCexAccount {
  type: 'okx';
  passphrase: string;
  simulated: string;
}

interface BTCAccount extends CommonBundleAccount {
  type: 'btc';
  address: string;
}

interface ETHAccount extends CommonBundleAccount {
  type: 'eth';
  data: IDisplayedAccountWithBalance;
}

type BundleAccount = BTCAccount | BNAccount | ETHAccount | OkxAccount;

// corresponding to the type in the HARDWARE_KEYRING_TYPES brandName
type HDManagerType = ['Trezor', 'Ledger', 'Onekey'][number];

type ISafeOpenDappTabOptions = {
  dontReloadOnSwitchToActiveTab?: boolean;
};

type WalletConnectSessionStatus =
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'RECEIVED'
  | 'EXPIRED'
  | 'ACCOUNT_ERROR'
  | 'BRAND_NAME_ERROR'
  | 'REJECTED'
  | 'ADDRESS_DUPLICATE';

type DOMRectValues = WriteableObj<
  Omit<DOMRectReadOnly, 'toJSON'>,
  'bottom' | 'height' | 'left' | 'right' | 'top' | 'width' | 'x' | 'y'
>;

type ISystemReleaseInfo = {
  sysVersion: string;
  majorVersion: number;
  isDeprecated: boolean;
};

type IDarwinMediaAccessType = Parameters<
  typeof import('electron').systemPreferences.getMediaAccessStatus
>[0];
type IDarwinMediaAccessStatus = ReturnType<
  typeof import('electron').systemPreferences.getMediaAccessStatus
>;
