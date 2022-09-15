/// <reference types="electron" />
/// <reference path="../isomorphic/types.d.ts" />

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
  'rabby-nav-info': {
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
    send: [];
    response: [
      {
        version: ReturnType<Electron.App['getVersion']>;
      }
    ];
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
        dapps: IDapp[];
      }
    ];
  };
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
      on<T extends Channels>(
        channel: T,
        func: (...args: ChannelMessagePayload[T]['response']) => void
      ): (() => void) | undefined;
      once<T extends Channels>(
        channel: T,
        func: (...args: ChannelMessagePayload[T]['response']) => void
      ): void;
    };
  };
}
