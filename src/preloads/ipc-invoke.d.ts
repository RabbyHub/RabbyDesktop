type RabbyxInvokePayload = {
  'rabbyx:get-app-version': {
    send: [];
    response: {
      version: ReturnType<Electron.App['getVersion']>;
    };
  };
};

type ChannelInvokePayload = {
  'get-app-version': {
    send: [];
    response: IAppVersions;
  };
  'get-os-info': {
    send: [];
    response: IOSInfo;
  };
  'get-rabbyx-info': {
    send: [];
    response: IRabbyxInfo;
  };
  'detect-dapp': {
    send: [dappUrl: string];
    response: {
      result: IDappsDetectResult;
    };
  };
  'dapps-fetch': {
    send: [];
    response: {
      dapps: IDapp[];
      pinnedList: IDapp['id'][];
      unpinnedList: IDapp['id'][];
    };
  };
  'get-dapp': {
    send: [dappID: IDapp['id']];
    response: {
      error?: string | null;
      data: {
        dapp: IDapp | null;
        isPinned: boolean;
      };
    };
  };
  'dapps-post': {
    send: [dapp: IDappPartial];
    response: {
      error?: string;
    };
  };
  'dapps-put': {
    send: [dapp: IDappPartial];
    response: void;
  };
  'dapps-replace': {
    send: [idsToDel: string | string[], newDapp: IDappPartial];
    response: {
      error?: string | null;
    };
  };
  'dapps-delete': {
    send: [dapp: Pick<IDapp, 'id' | 'origin'>];
    response: {
      error?: string;
    };
  };
  'dapps-togglepin': {
    send: [dappOrigins: IDapp['origin'][], nextPinned: boolean];
    response: {
      error?: string;
    };
  };
  'dapps-setOrder': {
    send: [
      {
        pinnedList?: IDapp['origin'][];
        unpinnedList?: IDapp['origin'][];
      }
    ];
    response: {
      error: string | null;
    };
  };
  'dapps-put-protocol-binding': {
    send: [bindings: IProtocolDappBindings];
    response: {
      error?: string;
    };
  };
  'dapps-fetch-protocol-binding': {
    send: [];
    response: {
      result: IProtocolDappBindings;
    };
  };
  'get-desktopAppState': {
    send: [];
    response: {
      state: IDesktopAppState;
    };
  };
  'put-desktopAppState': {
    send: [
      partialPayload: {
        [K in keyof IDesktopAppState]?: IDesktopAppState[K];
      }
    ];
    response: {
      state: IDesktopAppState;
    };
  };
  'toggle-activetab-animating': {
    send: [visible: boolean];
    response: void;
  };
  'check-proxyConfig': {
    send: [
      {
        detectURL: string;
        proxyConfig: IAppProxyConf['proxySettings'];
      }
    ];
    response: {
      valid: boolean;
      errMsg: string;
    };
  };
  'get-proxyConfig': {
    send: [];
    response: {
      runtime: IRunningAppProxyConf;
      systemProxy: IAppProxyConf['systemProxySettings'];
    };
  };
  'apply-proxyConfig': {
    send: [conf: IAppProxyConf];
    response: void;
  };
  'get-hid-devices': {
    send: [
      options?: {
        filters?: HIDDeviceRequestOptions['filters'];
      }
    ];
    response: {
      error?: string;
      devices: INodeHidDeviceInfo[];
    };
  };
  'get-usb-devices': {
    send: [
      options?: {
        filters?: HIDDeviceRequestOptions['filters'];
      }
    ];
    response: {
      devices: IUSBDevice[];
    };
  };
  'confirm-selected-device': {
    send: [
      {
        selectId: string;
        // null means cancel
        device: Pick<IHidDevice, 'deviceId' | 'productId' | 'vendorId'> | null;
      }
    ];
    response: {
      error: string | null;
    };
  };
  'parse-favicon': {
    send: [targetURL: string];
    response: {
      error?: string | null;
      favicon: IParsedFavicon | null;
    };
  };
  'preview-dapp': {
    send: [targetURL: string];
    response: {
      error?: string | null;
      previewImg: Uint8Array | string | null;
    };
  };
  'get-app-dynamic-config': {
    send: [];
    response: {
      error?: string | null;
      dynamicConfig: IAppDynamicConfig;
    };
  };
  'safe-open-dapp-tab': {
    send: [dappOrigin: string, opts?: ISafeOpenDappTabOptions];
    response: ISafeOpenDappTabResult;
  };
  'fetch-dapp-last-open-infos': {
    send: [];
    response: {
      error?: string | null;
      lastOpenInfos: Record<IDapp['id'], IDappLastOpenInfo>;
    };
  };
  'get-release-note': {
    send: [version?: string];
    response: {
      error?: string | null;
      result: string;
    };
  };
  'verify-update-package': {
    send: [];
    response: {
      error?: string | null;
      isValid: boolean;
    };
  };
  'check-trezor-like-cannot-use': {
    send: [openType: IHardwareConnectPageType];
    response: {
      reasons: ITrezorLikeCannotUserReason[];
      couldContinue: boolean;
    };
  };
  'app-relaunch': {
    send: [reason: 'trezor-like-used'];
    response: void;
  };
  [`__internal_rpc:rabbyx-rpc:query`]: {
    send: [query: Omit<IRabbyxRpcQuery, 'rpcId'>];
    response: {
      result: any;
      error?: Error;
    };
  };
  [`__outer_rpc:check-if-requestable`]: {
    send: [reqData?: any];
    response: {
      result: boolean;
      error?: string;
    };
  };
  'download-ipfs': {
    send: [ipfsString: string];
    response: {
      error?: string | null;
      success?: boolean;
    };
  };
  'cancel-download-ipfs': {
    send: [];
    response: void;
  };
  'binance-sdk': {
    send: [
      {
        apiKey: string;
        apiSecret: string;
        method: string;
        params?: any[];
      }
    ];
    response: any;
  };
  // Bundle
  'bundle-account-post': {
    send: [account: BundleAccount];
    response: {
      error?: string;
    };
  };
  'bundle-account-put': {
    send: [account: BundleAccount];
    response: any;
  };
  'bundle-account-delete': {
    send: [id: string];
    response: any;
  };
  'bundle-account-init': {
    send: [];
    response: any;
  };
  'bundle-account-update-balance': {
    send: [{ id?: string; balance?: string }[]];
    response: any;
  };
  'resolve-ipns': {
    send: [name: string];
    response: {
      result: string | null;
      error?: string | null;
    };
  };
  'open-directory': {
    send: [];
    response: Electron.OpenDialogReturnValue;
  };
  'get-webui-ext-navinfo': {
    send: [tabId: number];
    response: {
      tabNavInfo: IShellNavInfo;
    };
  };
} & RabbyxInvokePayload;

type IInvokesKey = keyof ChannelInvokePayload;
