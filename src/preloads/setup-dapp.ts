import { contextBridge } from 'electron';
import { checkIfUrlInjectEthereum } from '../isomorphic/url';
import { exposeToMainWorld, ipcRendererObj } from './base';

import BroadcastChannelMessage from '../extension-wallet/utils/message/BroadcastChannelMessage';
import PortMessage from '../extension-wallet/utils/message/PortMessageOrig';
import { randString } from '../isomorphic/string';

async function __rbCheckRequestable(reqData: any) {
  if (document.visibilityState === 'hidden') return false;

  try {
    const result = await ipcRendererObj.invoke(
      '__outer_rpc:check-if-requestable',
      reqData
    );
    if (result.error) {
      throw new Error(result.error);
    }

    // console.trace('[feat] result', result);

    return result.result;
  } catch (err) {
    console.error(err);
    return false;
  }
}

export function setupDapp() {
  const checkResult = checkIfUrlInjectEthereum(window.location.href);
  if (!checkResult.couldInject) return;

  if (checkResult.isInternal) {
    const channelName = randString();
    exposeToMainWorld('__RD_isDappSafeView', true);
    exposeToMainWorld('channelName', channelName);

    // TODO: not work in custom protocol
    const pm = new PortMessage().connect();
    const bcm = new BroadcastChannelMessage(channelName).listen((data: any) => {
      console.log('[feat] bcm:: data', data);
      return pm.request(data);
    });

    // // background notification
    // pm.on('message', (data) => bcm.send('message', data));

    // document.addEventListener('beforeunload', () => {
    //   bcm.dispose();
    //   pm.dispose();
    // });
  }

  try {
    contextBridge.exposeInMainWorld(
      '__rbCheckRequestable',
      __rbCheckRequestable
    );
  } catch (e) {
    Object.defineProperty(window, '__rbCheckRequestable', {
      value: __rbCheckRequestable,
      writable: false,
      configurable: false,
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const orig = (window as any).__rbCheckRequestable;

    const decriptor = Object.getOwnPropertyDescriptor(
      window,
      '__rbCheckRequestable'
    );
    if (!decriptor?.writable) return;

    Object.defineProperty(window, '__rbCheckRequestable', {
      value: orig,
      writable: false,
      configurable: false,
    });
  });
}
