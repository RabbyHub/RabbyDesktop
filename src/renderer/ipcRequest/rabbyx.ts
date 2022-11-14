import { CHAINS_LIST } from '@debank/common';
import { randString } from 'isomorphic/string';

export async function getConnectedSites() {
  const reqid = randString();

  // TODO: use timeout mechanism
  return new Promise<IConnectedSiteToDisplay[]>((resolve, reject) => {
    const dispose = window.rabbyDesktop.ipcRenderer.on(
      '__internal_rpc:webui-ext:get-connected-sites',
      (event) => {
        if (event.reqid === reqid) {
          const sites = event.sites.map((site) => {
            const chain = CHAINS_LIST.find(
              (ochain) => ochain.enum === site.chain
            )!;
            return {
              origin: site.origin,
              isConnected: site.isConnected,
              chainName: chain.name,
              chainId: chain.hex,
            } as IConnectedSiteToDisplay;
          });
          resolve(sites);
          dispose?.();
        }
      }
    );
    window.rabbyDesktop.ipcRenderer.sendMessage(
      '__internal_rpc:webui-ext:get-connected-sites',
      reqid
    );
  });
}
