import { filter, firstValueFrom, Subject } from 'rxjs';

import { RabbyXMethod } from '@/isomorphic/rabbyx';
import { safeParse } from '@/isomorphic/json';
import { onIpcMainEvent } from '../../utils/ipcMainEvents';
import { fromMainSubject } from '../_init';
import { randString } from '../../../isomorphic/string';
import { IS_RUNTIME_PRODUCTION } from '../../../isomorphic/constants';

export async function getRabbyxHost() {
  return firstValueFrom(fromMainSubject('rabbyExtViews')).then(
    (views) => views.backgroundHost
  );
}

const rabbyXRpcResponse = new Subject<IRabbyxRpcResponse>();
const obs = rabbyXRpcResponse.asObservable();

onIpcMainEvent('rabbyx-rpc-respond', (_, ret) => {
  const { rpcId, result, error } =
    typeof ret === 'string' ? safeParse(ret) : ret;

  // console.debug('[debug] rabbyx-rpc-respond:: ret', ret);

  if (!IS_RUNTIME_PRODUCTION) {
    // leave here for debug
    // console.log('[debug] rpcId, result', rpcId, result);
  }

  rabbyXRpcResponse.next({ rpcId, result, error });
});

export async function rabbyxQuery<T extends keyof RabbyXMethod>(
  method: T,
  params: Parameters<RabbyXMethod[T]> = [] as any,
  rpcId = randString(10)
): Promise<ReturnType<RabbyXMethod[T]>> {
  const host = await getRabbyxHost();

  const promise = firstValueFrom(
    obs.pipe(filter((payload) => rpcId === payload.rpcId))
  );

  host.send('rabbyx-rpc-query', {
    rpcId,
    method,
    params,
  });

  const { result, error } = await promise;

  if (error) {
    throw error;
  }

  return result;
}

onIpcMainEvent('__internal_rpc:rabbyx-rpc:query', async (evt, reqId, query) => {
  rabbyxQuery(query.method as any, query.params, reqId)
    .then((result) => {
      evt.reply('__internal_rpc:rabbyx-rpc:query', {
        reqId,
        result,
      });
    })
    .catch((error) => {
      evt.reply('__internal_rpc:rabbyx-rpc:query', {
        reqId,
        result: null,
        error,
      });
    });
});
