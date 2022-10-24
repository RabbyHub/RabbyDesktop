/// <reference types="electron" />
/// <reference path="../isomorphic/types.d.ts" />
/// <reference path="../isomorphic/type-helpers.d.ts" />

type M2RChanneMessagePayload = {
  'download-release-progress-updated': {
    originReqId: string;
    download: IAppUpdatorDownloadProgress
  },
  '__internal_rpc:webui-extension:switch-active-dapp': {
    tabId: number;
  },
  '__internal_rpc:security-notification': ISecurityNotificationPayload,
  '__internal_rpc:security-addressbarpopup:on-show': {
    origin: string;
    checkResult: ISecurityCheckResult;
  },
  '__internal_rpc:loading-view:dapp-did-finish-load': {},
}

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
  'webui-ext-navinfo': {
    send: [tabId: number];
    response: [
      {
        tabExists: boolean;
        canGoForward?: boolean;
        canGoBack?: boolean;

        tabUrl: string;

        dappSecurityCheckResult: ISecurityCheckResult | null;
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
  'get-app-version': {
    send: [reqid: string];
    response: [
      {
        reqid: string;
        version: ReturnType<Electron.App['getVersion']>;
      }
    ];
  };
  'detect-dapp': {
    send: [reqid: string, dappUrl: string];
    response: [
      {
        reqid: string;
        result: IDappsDetectResult
      }
    ]
  };
  'dapps-fetch': {
    send: [reqid: string];
    response: [
      {
        reqid: string;
        dapps: IDapp[];
      }
    ];
  };
  'dapps-put': {
    send: [reqid: string, dapp: IDapp];
    response: [
      {
        reqid: string;
        dapps: IDapp[];
      }
    ];
  };
  'dapps-delete': {
    send: [reqid: string, dapp: IDapp];
    response: [
      {
        reqid: string;
        error?: string;
        dapps: IDapp[];
      }
    ];
  };
  'redirect-mainWindow': {
    send: [],
    response: []
  };
  'get-desktopAppState': {
    send: [reqid: string];
    response: [
      {
        reqid: string;
        state: IDesktopAppState;
      }
    ]
  },
  'put-desktopAppState-hasStarted': {
    send: [reqid: string];
    response: [
      {
        reqid: string
      }
    ]
  },
  'check-if-new-release': {
    send: [reqid: string];
    response: [
      {
        reqid: string,
      } & IAppUpdatorCheckResult
    ]
  },
  'start-download': {
    send: [reqid: string];
    response: [
      {
        reqid: string,
      }
    ]
  },
  'quit-and-upgrade': {
    send: [reqid: string];
    response: [
      {
        reqid: string,
      }
    ]
  },
  'rabby:connect': {
    send: [reqid: string];
    response: [
      {
        origin: string;
        chainId: string;
        isConnected: boolean;
      }
    ]
  },
  '__internal_alert-security-url': {
    send: [];
    response: [
      {
        url: string
        isExisted: boolean
      }
    ]
  }
  '__internal_close-alert-insecure-content': {
    send: [];
    response: []
  },
  '__internal_rpc:security-check:get-dapp': {
    send: [reqid: string, dappUrl: string];
    response: [
      {
        reqid: string
        dappInfo: IDapp | null
      }
    ]
  },
  '__internal_rpc:security-check:check-dapp-and-put': {
    send: [reqid: string, dappUrl: string];
    response: [
      {
        reqid: string,
      } & ({
        result: null
        error: Error
      } | {
        result: ISecurityCheckResult
        error?: null
      })
    ]
  },
  '__internal_rpc:security-check:continue-open-dapp': {
    send: [continualOpenId: string, dappUrl: string];
    response: []
  },
  '__internal_rpc:security-check:continue-close-dapp': {
    send: [continualOpenId: string];
    response: []
  },
  '__internal_rpc:security-check:set-view-top': {
    send: [];
    response: []
  },
  '__internal_rpc:security-check:close-view': {
    send: [];
    response: []
  },
  '__internal_rpc:clipboard:close-view': {
    send: [];
    response: []
  },
  '__internal_rpc:browser:set-ignore-mouse-events': {
    send: [ignore: boolean, options?: Electron.IgnoreMouseEventsOptions];
    response: []
  },
  '__internal_rpc:browser-dev:openDevTools': {
    send: [];
    response: []
  },
  '__internal_rpc:security-addressbarpopup:show': {
    send: [
      dappUrl: string,
    ];
    response: []
  },
  '__internal_rpc:security-addressbarpopup:switch-pageview': {
    send: [
      state: ISecurityAddrbarPopupState
    ];
    response: [
      {
        state: ISecurityAddrbarPopupState,
      }
    ]
  },
  '__internal_rpc:security-addressbarpopup:hide': {
    send: [];
    response: [];
  },
  '__internal_webui-window-close': {
    send: [ winId: number, webContentsId: number ],
    response: []
  },
  '__internal__rabby:connect': {
    send: [ IConnectedSite ],
    response: [ IConnectedSite ]
  }
};

type Channels = keyof ChannelMessagePayload;

interface Window {
  // for built-in webview
  rabbyDesktop: {
    ipcRenderer: {
      /* send message to main process */
      sendMessage<T extends Channels>(
        channel: T,
        ...args: ChannelMessagePayload[T]['send']
      ): void;
      on: {
        <T extends Channels>(
          channel: T,
          func: (...args: ChannelMessagePayload[T]['response']) => void
        ): (() => void) | undefined;
        <T extends keyof M2RChanneMessagePayload>(
          channel: T,
          func: (event: M2RChanneMessagePayload[T]) => void
        ): (() => void) | undefined;
      }
      once: {
        <T extends Channels>(
          channel: T,
          func: (...args: ChannelMessagePayload[T]['response']) => void
        ): (() => void) | undefined;
        <T extends keyof M2RChanneMessagePayload>(
          channel: T,
          func: (event: M2RChanneMessagePayload[T]) => void
        ): (() => void) | undefined;
      }
    };
  };

  // for dapp webview
  __rD?: {
    tellConnection (info: IConnectedSite): void
  }

  // from dapp
  ethereum?: any
}
