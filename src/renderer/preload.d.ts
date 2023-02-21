/// <reference types="electron" />
/// <reference path="../main/internal.d.ts" />
/// <reference path="../isomorphic/types.d.ts" />
/// <reference path="../isomorphic/type-helpers.d.ts" />
/// <reference path="../preloads/forward.d.ts" />

type M2RChanneMessagePayload = {
  'download-release-progress-updated': {
    originReqId: string;
    download: IAppUpdatorDownloadProgress;
  };
  '__internal_push:webui-extension:switch-active-dapp': {
    tabId: number;
  };
  '__internal_push:security-check:start-check-dapp': {
    url: string;
    continualOpId: string;
  };
  '__internal_push:security-notification': ISecurityNotificationPayload;
  '__internal_push:security-addressbarpopup:on-show': {
    origin: string;
    checkResult: ISecurityCheckResult;
  };
  '__internal_push:dapp-tabs:open-safe-view': INonSameDomainAction;
  '__internal_push:mainwindow:all-tabs-closed': {
    windowId: number;
  };
  '__internal_push:mainwindow:state-changed': {
    windowState: chrome.windows.windowStateEnum;
  };
  '__internal_push:mainwindow:got-dapp-screenshot': {
    imageBuf: Buffer | null;
  };
  '__internal_push:dapps:changed': MainInternalsMessagePayload['__internal_main:dapps:changed']['send'][0];
  '__internal_push:popupwin-on-mainwin:on-visiblechange':
    | {
        type: IPopupWinPageInfo['type'];
        visible: true;
        pageInfo: IPopupWinPageInfo;
      }
    | {
        type: IPopupWinPageInfo['type'];
        visible: false;
      };
  '__internal_push:popupview-on-mainwin:on-visiblechange': IPopupViewChanges;

  /* eslint-disable-next-line @typescript-eslint/ban-types */
  '__internal_push:loading-view:toggle': ChannelMessagePayload['__internal_rpc:mainwindow:toggle-loading-view']['send'][0];

  [`rabbyx-rpc-query`]: IRabbyxRpcQuery;

  '__internal_push:rabbyx:focusing-dapp-changed': {
    previousUrl: string;
    currentUrl: string;
  };
  '__internal_push:rabbyx:session-broadcast-forward-to-desktop': RabbyEvent;

  '__internal_push:rabbyx:get-dapp-screenshot': {
    reqId: string;
  };
  '__internal_push:webusb:device-changed': {
    changes: {
      type: 'connect' | 'disconnect';
      device: INodeWebUSBDevice;
    };
  };
  '__internal_push:webhid:select-list': {
    deviceList: IMergedHidDevice[];
  };
  '__internal_push:webhid:select-devices-modal-blur': {
    foo?: string;
  };
};

type IPushEvents = keyof M2RChanneMessagePayload;

type ChannelMessagePayload = {
  'ipc-example': {
    send: [string];
    response: [string];
  };
  'chrome-extension-loaded': {
    send: [];
    response: [
      {
        name: 'rabby';
        extension: Electron.Extension;
      }
    ];
  };
  '__internal_rpc:webui-ext:navinfo': {
    send: [reqid: string, tabId: number];
    response: [
      {
        reqid: string;
        tabNavInfo: IShellNavInfo;
      }
    ];
  };
  'rabby-extension-id': {
    send: [];
    response: [
      {
        rabbyExtensionId: Electron.Extension['id'];
      }
    ];
  };
  'check-if-new-release': {
    send: [reqid: string];
    response: [
      {
        reqid: string;
      } & IAppUpdatorCheckResult
    ];
  };
  'start-download': {
    send: [reqid: string];
    response: [
      {
        reqid: string;
      }
    ];
  };
  'quit-and-upgrade': {
    send: [reqid: string];
    response: [
      {
        reqid: string;
      }
    ];
  };
  '__internal_rpc:main-window:click-close': {
    send: [];
    response: [];
  };
  '__internal_rpc:trezor-like-window:click-close': {
    send: [];
    response: [];
  };
  '__internal_forward:main-window:getCurrentTab': {
    send: [];
    response: [chrome.tabs.Tab];
  };
  '__internal_forward:main-window:close-tab': {
    send: [tabId: number];
    response: [tabId: number];
  };
  '__internal_forward:main-window:open-dapp': {
    send: [origin: IDapp['origin']];
    response: [origin: IDapp['origin']];
  };
  '__internal_forward:views:channel-message': {
    send: MainInternalsMessagePayload['__internal_main:views:channel-message']['send'];
    response: MainInternalsMessagePayload['__internal_main:views:channel-message']['send'];
  };
  '__internal_rpc:dapp-tabs:close-safe-view': {
    send: [];
    response: [];
  };
  '__internal_rpc:security-check:get-dapp': {
    send: [reqid: string, dappUrl: string];
    response: [
      {
        reqid: string;
        dappInfo: IDapp | null;
      }
    ];
  };
  '__internal_rpc:security-check:check-dapp-and-put': {
    send: [reqid: string, dappUrl: string];
    response: [
      {
        reqid: string;
      } & (
        | {
            result: null;
            error: Error;
          }
        | {
            result: ISecurityCheckResult;
            error?: null;
          }
      )
    ];
  };
  '__internal_rpc:security-check:continue-close-dapp': {
    send: [continualOpId: string];
    response: [];
  };
  '__internal_rpc:security-check:set-view-top': {
    send: [];
    response: [];
  };
  '__internal_rpc:security-check:close-view': {
    send: [];
    response: [];
  };
  '__internal_rpc:security-notification:close-view': {
    send: [];
    response: [];
  };
  '__internal_rpc:browser:set-ignore-mouse-events': {
    send: [ignore: boolean, options?: Electron.IgnoreMouseEventsOptions];
    response: [];
  };
  '__internal_rpc:browser-dev:openDevTools': {
    send: [];
    response: [];
  };
  '__internal_rpc:security-addressbarpopup:request-show': {
    send: [dappUrl: string];
    response: [];
  };
  '__internal_rpc:security-addressbarpopup:do-show': {
    send: [];
    response: [];
  };
  '__internal_rpc:security-addressbarpopup:switch-pageview': {
    send: [state: ISecurityAddrbarPopupState];
    response: [
      {
        state: ISecurityAddrbarPopupState;
      }
    ];
  };
  '__internal_rpc:security-addressbarpopup:hide': {
    send: [];
    response: [];
  };
  '__internal_rpc:mainwindow:open-tab': {
    send: [dappOrigin: string];
    response: [];
  };
  '__internal_rpc:mainwindow:select-tab': {
    send: [winId: number, tabId: number];
    response: [];
  };
  '__internal_rpc:mainwindow:reload-tab': {
    send: [tabId: number];
    response: [];
  };
  '__internal_rpc:mainwindow:stop-tab-loading': {
    send: [tabId: number];
    response: [];
  };
  '__internal_rpc:mainwindow:make-sure-dapp-opened': {
    send: [dappOrigin: string];
    response: [];
  };
  '__internal_rpc:mainwindow:report-activeDapp-rect': {
    send: [rect: IMainWindowActiveTabRect];
    response: [];
  };
  '__internal_rpc:preview-dapp-frame:toggle-show': {
    send: [rect: IPreviewDappViewChanges];
    response: [];
  };
  '__internal_rpc:mainwindow:toggle-loading-view': MainInternalsMessagePayload['__internal_main:mainwindow:toggle-loading-view'];
  '__internal_rpc:popupview-on-mainwin:toggle-show': MainInternalsMessagePayload['__internal_main:popupview-on-mainwin:toggle-show'];
  '__internal_rpc:popupwin-on-mainwin:toggle-show': MainInternalsMessagePayload['__internal_main:popupwin-on-mainwin:toggle-show'];
  '__internal_rpc:app:open-external-url': {
    send: [externalURL: string];
    response: [];
  };
  '__internal_rpc:app:reset-app': MainInternalsMessagePayload['__internal_main:app:reset-app'];
  '__internal_rpc:debug-tools:operate-debug-insecure-dapps': {
    send: [type: 'add' | 'trim'];
    response: [];
  };
  '__internal_webui-window-close': {
    send: [winId: number, webContentsId: number];
    response: [];
  };

  '__internal_rpc:rabbyx:waitExtBgGhostLoaded': {
    send: [reqid: string];
    response: [
      {
        reqid: string;
        rabbyxExtId: string;
      }
    ];
  };

  '__internal_rpc:rabbyx:close-signwin': {
    send: [];
    response: [];
  };

  [`rabbyx-rpc-respond`]: {
    send: [string | IRabbyxRpcResponse];
    response: [];
  };
  [`rabbyx-initialized`]: {
    send: [time: number];
    response: [];
  };

  '__internal_rpc:rabbyx:on-session-broadcast': {
    send: [
      {
        event: string;
        data?: any;
        origin?: string;
      }
    ];
    response: [];
  };
};

type IChannelsKey = keyof ChannelMessagePayload;

type ChannelInvokePayload = {
  'get-app-version': {
    send: [];
    response: {
      version: ReturnType<Electron.App['getVersion']>;
    };
  };
  'get-os-info': {
    send: [];
    response: IOSInfo;
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
      pinnedList: IDapp['origin'][];
      unpinnedList: IDapp['origin'][];
    };
  };
  'get-dapp': {
    send: [origin: IDapp['origin']];
    response: {
      dapp: IDapp | null;
      isPinned: boolean;
    };
  };
  'dapps-post': {
    send: [dapp: IDapp];
    response: {
      error?: string;
    };
  };
  'dapps-put': {
    send: [dapp: IDapp];
    response: void;
  };
  'dapps-replace': {
    send: [originsToDel: string | string[], newDapp: IDapp];
    response: {
      error?: string | null;
    };
  };
  'dapps-delete': {
    send: [dapp: IDapp];
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
      persisted: IAppProxyConf;
      runtime: IRunningAppProxyConf;
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
  [`__internal_rpc:rabbyx-rpc:query`]: {
    send: [query: Omit<IRabbyxRpcQuery, 'rpcId'>];
    response: {
      result: any;
      error?: Error;
    };
  };
};
type IInvokesKey = keyof ChannelInvokePayload;

interface Window {
  // for built-in webview
  rabbyDesktop: {
    ipcRenderer: {
      /* send message to main process */
      sendMessage<T extends IChannelsKey>(
        channel: T,
        ...args: ChannelMessagePayload[T]['send']
      ): void;
      invoke<T extends IInvokesKey>(
        channel: T,
        ...args: ChannelInvokePayload[T]['send']
      ): Promise<ChannelInvokePayload[T]['response']>;
      on: {
        <T extends IChannelsKey>(
          channel: T,
          func: (...args: ChannelMessagePayload[T]['response']) => void
        ): (() => void) | undefined;
        <T extends keyof M2RChanneMessagePayload>(
          channel: T,
          func: (event: M2RChanneMessagePayload[T]) => void
        ): (() => void) | undefined;
      };
      once: {
        <T extends IChannelsKey>(
          channel: T,
          func: (...args: ChannelMessagePayload[T]['response']) => void
        ): (() => void) | undefined;
        <T extends keyof M2RChanneMessagePayload>(
          channel: T,
          func: (event: M2RChanneMessagePayload[T]) => void
        ): (() => void) | undefined;
      };
    };
    rendererHelpers: {
      b64ToObjLink: (b64: string) => string;
      bufToObjLink: (buf: Buffer | Uint8Array) => string;
    };
  };

  __RD_isDappSafeView?: boolean;

  // from dapp
  ethereum?: any;
}
