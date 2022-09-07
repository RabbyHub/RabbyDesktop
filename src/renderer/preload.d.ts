import { ChannelMessagePayload, Channels } from 'main/preload';

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        sendMessage<T extends Channels>(channel: T, args: ChannelMessagePayload[T]): void;
        on<T extends Channels>(
          channel: T,
          func: (...args: ChannelMessagePayload[T]) => void
        ): (() => void) | undefined;
        once<T extends Channels>(channel: T, func: (...args: ChannelMessagePayload[T]) => void): void;
      };
    };
  }
}

export {};
