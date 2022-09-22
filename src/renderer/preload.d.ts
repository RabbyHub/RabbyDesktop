/// <reference types="electron" />
/// <reference path="../isomorphic/types.d.ts" />

type M2RChanneMessagePayload = {
  'download-release-progress-updated': {
    originReqId: string;
    download: IAppUpdatorDownloadProgress
  }
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
  '__internal_webui-window-close': {
    send: [ winId: number, webContentsId: number ],
    response: []
  }
};

type Channels = keyof ChannelMessagePayload;

interface Window {
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
}
