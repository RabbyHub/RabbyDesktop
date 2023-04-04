import { arraify } from '@/isomorphic/array';
import { canoicalizeDappUrl } from '@/isomorphic/url';
import { matomoRequestEvent } from '../utils/matomo-request';

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
  const res = window.rabbyDesktop.ipcRenderer.invoke('dapps-post', dapp);
  res.then((r) => {
    if (!r.error) {
      matomoRequestEvent({
        category: 'My Dapp',
        action: 'Add Dapp',
        label: dapp.origin,
      });
    }
  });
  return res;
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
      } else {
        matomoRequestEvent({
          category: 'My Dapp',
          action: 'Delete Dapp',
          label: dapp.origin,
        });
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
    .then((r) => {
      if (!r.error && nextPinned) {
        matomoRequestEvent({
          category: 'My Dapp',
          action: 'Pin Dapp',
          label: Array.isArray(dappOrigin) ? dappOrigin.join(',') : dappOrigin,
        });
      }
      return r;
    });
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

export async function downloadIPFS(cid: string) {
  return window.rabbyDesktop.ipcRenderer.invoke('download-ipfs', cid);
}

export async function cancelDownloadIPFS() {
  return window.rabbyDesktop.ipcRenderer.invoke('cancel-download-ipfs');
}
