/* from builder-util-runtime/out/ProgressCallbackTransform.d.ts */
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

type IDapp = {
  // TODO: implement it;
  id?: string;
  alias: string;
  origin: string | `https://${string}${string}`;
  faviconUrl?: string;
  faviconBase64?: string;
};

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

type ISensitiveConfig = {
  enableContentProtected: boolean;
} & IAppProxyConf;

type IDappsDetectResult<T extends string = string> = {
  data: null | {
    urlInfo: Partial<URL> | null;
    origin: string;
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
      type: 'switch-chain';
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
      type: 'add-address';
    }
  | {
      type: 'address-management';
    }
  | {
      type: 'quick-swap';
      state?: any;
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
