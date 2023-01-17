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
