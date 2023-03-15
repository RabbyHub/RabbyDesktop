import { arraify } from '@/isomorphic/array';
import { canoicalizeDappUrl } from '@/isomorphic/url';

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
      unpinnedList: event.unpinnedList,
    };
  });
}

export async function detectDapps(dappUrl: string) {
  return window.rabbyDesktop.ipcRenderer
    .invoke('detect-dapp', dappUrl)
    .then((event) => {
      // ignore REPEAT
      if (event.result.error?.type === 'REPEAT') {
        return {
          ...event.result,
          error: undefined,
        };
      }
      return event.result;
    });
}

export async function addDapp(dapp: IDapp) {
  return window.rabbyDesktop.ipcRenderer.invoke('dapps-post', dapp);
}

export async function putDapp(dapp: IDapp) {
  return window.rabbyDesktop.ipcRenderer.invoke('dapps-put', dapp);
}

export async function replaceDapp(
  originsToDel: string | string[],
  dapp: IDapp
) {
  return window.rabbyDesktop.ipcRenderer.invoke(
    'dapps-replace',
    originsToDel,
    dapp
  );
}

export async function deleteDapp(dapp: IDapp) {
  return window.rabbyDesktop.ipcRenderer
    .invoke('dapps-delete', dapp)
    .then((event) => {
      if (event.error) {
        throw new Error(event.error);
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
    .then(() => {});
}

export async function setDappsOrder(payload: {
  pinnedList?: string[];
  unpinnedList?: string[];
}) {
  return window.rabbyDesktop.ipcRenderer
    .invoke('dapps-setOrder', payload)
    .then((event) => {
      if (event.error) {
        throw new Error(event.error);
      }
    });
}

export async function putProtocolDappsBinding(
  protocolDappsMap: IProtocolDappBindings
): Promise<void>;
export async function putProtocolDappsBinding(
  protocol: string,
  binding: IProtocolDappBindings[any]
): Promise<void>;
export async function putProtocolDappsBinding(...args: any[]): Promise<void> {
  let map: IProtocolDappBindings = {};
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

export async function fetchLastOpenInfos() {
  return window.rabbyDesktop.ipcRenderer
    .invoke('fetch-dapp-last-open-infos')
    .then((res) => {
      if (res.error) {
        return {};
      }

      return res.lastOpenInfos;
    });
}

export async function getLastOpenOriginByOrigin(dappOrigin: string) {
  const lastOpenInfos = await fetchLastOpenInfos();

  const parsedInfo = canoicalizeDappUrl(dappOrigin);
  const lastInfo =
    lastOpenInfos[parsedInfo.origin] ||
    lastOpenInfos[parsedInfo.secondaryOrigin];

  if (!lastInfo?.finalURL) return dappOrigin;

  const parseLastInfo = canoicalizeDappUrl(lastInfo.finalURL);
  return parseLastInfo.origin || dappOrigin;
}
