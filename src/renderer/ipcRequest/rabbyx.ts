import {
  RabbyXContollerMethods,
  RabbyXContollerMeththodNames,
  RabbyXContollerNS,
  RabbyXMethods,
} from '@/isomorphic/rabbyx';
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

function fixArgs(
  key: keyof RabbyXMethods,
  args: Parameters<RabbyXMethods[typeof key]>
) {
  const newArgs = [...args] as typeof args;
  switch (key) {
    default:
      break;
  }

  return newArgs;
}

/**
 * @description make etch rpc client, based on fetch(by default), or Axios Client
 */
function makeRabbyXController<T extends RabbyXContollerNS>(namespace: T) {
  const rabbyxClient = new Proxy<{
    [P in RabbyXContollerMeththodNames[T]]: RabbyXContollerMethods[T][P];
  }>({} as any, {
    get(_, prop: RabbyXContollerMeththodNames[T]) {
      return async function (...args: any[]) {
        const fixedArgs = fixArgs(prop as keyof RabbyXMethods, args as any);
        const reqId = randString();

        const p = new Promise(function (resolve, reject) {
          const dispose = window.rabbyDesktop?.ipcRenderer.on(
            '__internal_rpc:rabbyx-rpc:query',
            (event) => {
              // leave here for debug
              // console.debug(
              //   '[debug] __internal_rpc:rabbyx-rpc:query event back',
              //   event
              // );
              if (event.reqId === reqId) {
                dispose?.();

                if (event.error) {
                  // const err = new Error(`[rabbyx-controller] message: '${event.error.message}'; code: '${event.error.code}';`);
                  // (err as any).rpcError = event.error;
                  reject(event.error);
                } else {
                  resolve(event.result);
                }
              }
            }
          );
        });

        window.rabbyDesktop?.ipcRenderer.sendMessage(
          '__internal_rpc:rabbyx-rpc:query',
          reqId,
          {
            method: `${namespace}.${prop}`,
            params: fixedArgs,
          }
        );

        return p;

        // // console.debug('[debug] data', data);
        // if (data.error) {
        //     const err = new Error(`[rabbyx-controller] message: '${data.error.message}'; code: '${data.error.code}';`);
        //     (err as any).rpcError = data.error;
        //     throw err;
        // }

        // if (!data.code && ('result' in data)) {
        //     return data.result;
        // }
      };
    },
  });

  return rabbyxClient;
}

export const walletController = makeRabbyXController('walletController');
