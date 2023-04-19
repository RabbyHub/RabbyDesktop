import {
  contextBridge,
  ipcRenderer,
  IpcRendererEvent,
  nativeImage,
} from 'electron';
import { formatDappURLToShow } from '../isomorphic/dapp';

// increase the max listeners to avoid the warning or memory leak
ipcRenderer.setMaxListeners(50);

export const ipcRendererObj = {
  sendMessage<T extends IChannelsKey>(
    channel: T,
    ...args: ChannelMessagePayload[T]['send']
  ) {
    ipcRenderer.send(channel, ...args);
  },
  sendSync<T extends ISendSyncKey>(
    channel: T,
    ...args: ChannelSendSyncPayload[T]['send']
  ): ChannelSendSyncPayload[T]['returnValue'] {
    return ipcRenderer.sendSync(channel, ...args);
  },
  invoke<T extends IInvokesKey>(
    channel: T,
    ...args: ChannelInvokePayload[T]['send']
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

  formatDappURLToShow: (dappURL) => {
    return formatDappURLToShow(dappURL);
  },
};

/**
 * @description make sure k not exists in `window`
 * @param k
 * @param v
 */
export function exposeToMainWorld(k: string, v: any) {
  try {
    contextBridge.exposeInMainWorld(k, v);
  } catch (e) {
    // TODO: only enable this on dev!
    console.error('exposeToMainWorld:: e', e);

    delete (window as any)[k];
    Object.defineProperty(window, k, {
      value: v,
      writable: false,
      configurable: false,
    });
  }
}
