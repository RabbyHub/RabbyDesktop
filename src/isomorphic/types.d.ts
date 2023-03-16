/* from builder-util-runtime/out/ProgressCallbackTransform.d.ts */
type IAppVersions = {
  version: ReturnType<Electron.App['getVersion']>;
  appChannel: 'reg' | 'prod';
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

type IDappType = INextDapp['type'];
type INextDapp = {
  id: string;
  alias: string;
} & (
  | {
      type: 'unknown';
      origin: string;
    }
  | {
      type: 'http';
      origin: string | `https://${string}${string}`;
      faviconUrl?: string;
      faviconBase64?: string;
    }
  | {
      type: 'ipfs';
      origin: string | `ipfs://${string}${string}`;
    }
);

type IHttpDapp = INextDapp & { type: 'http' };
/**
 * @description alias of http type dapp
 */
type IDapp = IHttpDapp;

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
  sidebarCollapsed: boolean;
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

type IAppProxyConf = {
  proxyType: 'none' | 'system' | 'custom';
  proxySettings: {
    protocol: 'socks5' | 'http';
    hostname: string;
    port: number;
    username?: string;
    password?: string;
  };
};

type IRunningAppProxyConf = IAppProxyConf & { applied: boolean };

type ISensitiveConfig = {
  enableContentProtected: boolean;
} & IAppProxyConf;

type IDappsDetectResult<T extends string = string> = {
  data: null | {
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
    }
  | {
      hasNewRelease: false;
      releaseVersion: null;
    };

type IAppUpdatorDownloadProgress =
  | {
      progress: ProgressInfo;
      isEnd: false;
    }
  | {
      progress: null;
      isEnd: true;
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
      type: 'sidebar-dapp';
      dappTabInfo: {
        origin: string;
        id: chrome.tabs.Tab['id'];
      };
    }
  | {
      type: 'switch-chain-tmp';
      dappTabInfo: {
        id: chrome.tabs.Tab['id'];
        url: chrome.tabs.Tab['url'];
      };
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

type PopupViewOnMainwinInfo =
  | {
      type: 'add-address-dropdown';
      triggerRect?: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
      };
    }
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
      type: 'z-popup';
    }
  | {
      type: 'global-toast-popup';
      state?: {
        toastType?: 'foo';
      };
    };

type IShellNavInfo = {
  tabExists: boolean;
  canGoForward?: boolean;
  canGoBack?: boolean;
  tabUrl: string;
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

type IBuiltinViewName = PopupViewOnMainwinInfo['type'] | 'main-window';

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
  isOpenExternal: boolean;
  isTargetDapp?: boolean;
  isTargetDappByOrigin?: boolean;
  isTargetDappBySecondaryOrigin?: boolean;
};
