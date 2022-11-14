import { filter, firstValueFrom, Subject } from 'rxjs';

import { onIpcMainEvent } from '../../utils/ipcMainEvents';
import { fromMainSubject } from '../_init';
import { randString } from '../../../isomorphic/string';
import { IS_RUNTIME_PRODUCTION } from '../../../isomorphic/constants';

export async function getRabbyxHost () {
  return firstValueFrom(fromMainSubject('rabbyExtViews')).then(views => views.backgroundHost);
};

const rabbyXRpcResponse = new Subject<IRabbyxRpcResponse>();
const obs = rabbyXRpcResponse.asObservable();

onIpcMainEvent('rabbyx-rpc-respond', (_, { rpcId, result }) => {
  if (!IS_RUNTIME_PRODUCTION) {
    // leave here for debug
    // console.log('[debug] rpcId, result', rpcId, result);
  }

  rabbyXRpcResponse.next({ rpcId, result });
});

export async function rabbyxQuery (method: string, params: any[] = []) {
  const host = await getRabbyxHost();

  const rpcId = randString(10);

  const promise = firstValueFrom(
    obs.pipe(
      filter((payload) => rpcId === payload.rpcId),
    )
  );

  host.send('rabbyx-rpc-query', {
    rpcId,
    method,
    params,
  });

  return promise.then(res => res.result);
}
