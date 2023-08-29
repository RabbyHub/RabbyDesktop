import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import {
  RabbyXContollerMethods,
  RabbyXContollerMeththodNames,
  RabbyXContollerNS,
  RabbyXMethods,
} from '@/isomorphic/types/rabbyx';
import { randString } from 'isomorphic/string';

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

        const method = `${namespace}.${prop}`;
        return window.rabbyDesktop?.ipcRenderer
          .invoke('__internal_rpc:rabbyx-rpc:query', {
            method,
            params: fixedArgs,
          })
          .then((event) => {
            // leave here for debug
            // console.debug(
            //   '[debug] __internal_rpc:rabbyx-rpc:query event back',
            //   event
            // );
            if (event.error) {
              // const err = new Error(`[rabbyx-controller] message: '${event.error.message}'; code: '${event.error.code}';`);
              // (err as any).rpcError = event.error;
              if (!IS_RUNTIME_PRODUCTION) {
                console.error(
                  `[rabbyx-controller] error on calling '${method}'`,
                  event.error
                );
              }
              throw event.error;
            }

            return event.result;
          });
      };
    },
  });

  return rabbyxClient;
}

export const walletController = makeRabbyXController('walletController');
export const walletOpenapi = makeRabbyXController('openapi');
export const walletTestnetOpenapi = makeRabbyXController('testnetOpenapi');
export const permissionService = makeRabbyXController('permissionService');
