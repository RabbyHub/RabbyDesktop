import { ipcRenderer, IpcRendererEvent, nativeImage } from 'electron';

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

export const rendererHelpers: Window['rabbyDesktop']['rendererHelpers'] = {
  b64ToObjLink: (b64) => {
    const image = nativeImage.createFromDataURL(b64);
    const buf = image.toPNG();
    const blobLink = URL.createObjectURL(
      new Blob([buf], { type: 'image/png' })
    );

    return blobLink;
  },
  bufToObjLink: (buf) => {
    const blobLink = URL.createObjectURL(
      new Blob([buf], { type: 'image/png' })
    );

    return blobLink;
  },
};
