type ChannelMessagePayload = {
  'ipc-example': {
    send: [string]
    response: [string]
  },
  'chrome-extension-loaded': {
    send: [
    ],
    response: [
      {
        name: 'rabby',
        extension: Electron.Extension,
      }
    ]
  },
  'rabby-nav-info': {
    send: [
      tabId: number
    ],
    response: [
      {
        tabExists: boolean
        canGoForward?: boolean,
        canGoBack?: boolean,
      }
    ]
  }
}

type Channels = keyof ChannelMessagePayload

interface Window {
  rabbyDesktop: {
    ipcRenderer: {
      /* send message to main process */
      sendMessage<T extends Channels>(channel: T, args: ChannelMessagePayload[T]['send']): void;
      on<T extends Channels>(
        channel: T,
        func: (...args: ChannelMessagePayload[T]['response']) => void
      ): (() => void) | undefined;
      once<T extends Channels>(channel: T, func: (...args: ChannelMessagePayload[T]['response']) => void): void;
    };
  };
}
