import { ipcRenderer, IpcRendererEvent } from 'electron';

export const ipcRendererObj = {
  sendMessage<T extends IChannelsKey>(
    channel: T,
    ...args: ChannelMessagePayload[T]['send']
  ) {
    ipcRenderer.send(channel, ...args);
  },
  invoke<T extends IChannelsKey>(
    channel: T,
    ...args: ChannelMessagePayload[T]['send']
  ) {
    return ipcRenderer.invoke(channel, ...args);
  },
  on<T extends IChannelsKey>(
    channel: T,
    func: (...args: ChannelMessagePayload[T]['response']) => void
  ) {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
      func(...(args as any));
    ipcRenderer.on(channel, subscription);

    return () => ipcRenderer.removeListener(channel, subscription);
  },
  once<T extends IChannelsKey>(
    channel: T,
    func: (...args: ChannelMessagePayload[T]['response']) => void
  ) {
    ipcRenderer.once(channel, (_event, ...args) => func(...(args as any)));
  },
};
