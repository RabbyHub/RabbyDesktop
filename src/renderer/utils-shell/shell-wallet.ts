import PortMessage from '@/extension-wallet/utils/message/portMessage';
import type {
  RabbyXContollerMethods,
  RabbyXContollerMeththodNames,
  RabbyXContollerNS,
} from '@/isomorphic/types/rabbyx';
import eventBus from './eventBus';

export function makeShellWallet<
  T extends RabbyXContollerNS = 'walletController'
>(
  rabbyxExtId: string
): {
  [P in RabbyXContollerMeththodNames[T]]: RabbyXContollerMethods[T][P];
} {
  const portMessageChannel = new PortMessage({ rabbyxExtId });

  portMessageChannel.connect('rabbyDesktop');

  const wallet = new Proxy(
    {},
    {
      get(_t1, key) {
        switch (key) {
          case 'openapi':
            return new Proxy(
              {},
              {
                get(_t2, openapiKey) {
                  return function (...params: any) {
                    return portMessageChannel.request({
                      type: 'openapi',
                      method: openapiKey,
                      params,
                    });
                  };
                },
              }
            );
            break;
          default:
            return function (...params: any) {
              return portMessageChannel.request({
                type: 'controller',
                method: key,
                params,
              });
            };
        }
      },
    }
  ) as any;

  portMessageChannel.listen((data: any) => {
    if (data.type === 'broadcast') {
      eventBus.emit(data.method, data.params);
    }
  });

  eventBus.addEventListener('broadcastToBackground', (data) => {
    portMessageChannel.request({
      type: 'broadcast',
      method: data.method,
      params: data.data,
    });
  });

  return wallet;
}
