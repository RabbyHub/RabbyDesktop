import { filter, firstValueFrom, Subject } from 'rxjs';

import { RabbyXMethod } from '@/isomorphic/rabbyx';
import { safeParse } from '@/isomorphic/json';
import { onIpcMainEvent } from '../../utils/ipcMainEvents';
import { fromMainSubject } from '../_init';
import { randString } from '../../../isomorphic/string';
import { IS_RUNTIME_PRODUCTION } from '../../../isomorphic/constants';

async function getRabbyxBgWebContents() {
  return firstValueFrom(fromMainSubject('rabbyExtViews')).then(
    (views) => views.backgroundWebContents
  );
}

const rabbyXRpcResponse = new Subject<IRabbyxRpcResponse>();
const obs = rabbyXRpcResponse.asObservable();

onIpcMainEvent('rabbyx-rpc-respond', (_, ret) => {
  const { rpcId, result, error } =
    typeof ret === 'string' ? safeParse(ret) : ret;

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
  const backgroundWebContents = await getRabbyxBgWebContents();

  const promise = firstValueFrom(
    obs.pipe(filter((payload) => rpcId === payload.rpcId))
  );

  const reqPayload = {
    rpcId,
    method,
    params,
  };
  // backgroundWebContents.send('rabbyx-rpc-query', reqPayload);

  // dispatch custom event
  backgroundWebContents.executeJavaScript(`
    ;(function () {
      const queryEvent = new CustomEvent('rabbyx-rpc-query', {
        detail: ${JSON.stringify(reqPayload)},
      });
      document.dispatchEvent(queryEvent);
    })();
  `);

  const { result, error } = await promise;

  if (error) {
    throw error;
  }

  return result;
}
