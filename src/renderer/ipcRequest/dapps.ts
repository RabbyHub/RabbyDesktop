import { arraify } from '@/isomorphic/array';

export async function getDapp(dappOrigin: string) {
  return window.rabbyDesktop.ipcRenderer
    .invoke('get-dapp', dappOrigin)
    .then((event) => {
      return {
        ...event.dapp,
        isPinned: event.dapp ? event.isPinned : false,
      };
    });
}

export async function fetchDapps() {
  return window.rabbyDesktop.ipcRenderer.invoke('dapps-fetch').then((event) => {
    return {
      dapps: event.dapps,
      pinnedList: event.pinnedList,
    };
  });
}

export async function detectDapps(dappUrl: string) {
  return window.rabbyDesktop.ipcRenderer
    .invoke('detect-dapp', dappUrl)
    .then((event) => {
      return event.result;
    });
}

export async function putDapp(dapp: IDapp) {
  return window.rabbyDesktop.ipcRenderer
    .invoke('dapps-put', dapp)
    .then((event) => {
      return event.dapps;
    });
}

export async function deleteDapp(dapp: IDapp) {
  return window.rabbyDesktop.ipcRenderer
    .invoke('dapps-delete', dapp)
    .then((event) => {
      if (event.error) {
        throw new Error(event.error);
      } else {
        return event.dapps;
      }
    });
}

export async function toggleDappPinned(
  dappOrigin: string | string[],
  nextPinned = true
) {
  const dappOrigins = arraify(dappOrigin);

  return window.rabbyDesktop.ipcRenderer
    .invoke('dapps-togglepin', dappOrigins, nextPinned)
    .then((event) => {
      return event.pinnedList;
    });
}

export async function putProtocolDappsBinding(
  protocolDappsMap: Record<string, IDapp['origin'][]>
): Promise<void>;
export async function putProtocolDappsBinding(
  protocol: string,
  dappOrigins: IDapp['origin'][]
): Promise<void>;
export async function putProtocolDappsBinding(...args: any[]): Promise<void> {
  let map: Record<string, IDapp['origin'][]> = {};
  if (typeof args[0] === 'object') {
    map = { ...args[0] };
  } else {
    // eslint-disable-next-line prefer-destructuring
    map[args[0]] = args[1];
  }

  return window.rabbyDesktop.ipcRenderer
    .invoke('dapps-put-protocol-binding', map)
    .then((event) => {
      if (event.error) {
        throw new Error(event.error);
      }
    });
}

export async function fetchProtocolDappsBinding() {
  return window.rabbyDesktop.ipcRenderer
    .invoke('dapps-fetch-protocol-binding')
    .then((event) => {
      return event.result;
    });
}
