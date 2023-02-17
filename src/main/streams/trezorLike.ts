import {
  catchError,
  filter,
  firstValueFrom,
  map,
  of,
  startWith,
  Subject,
  timeout,
} from 'rxjs';
import { onIpcMainEvent } from '../utils/ipcMainEvents';

const confirmOpenSubj = new Subject<IConfirmConnectTrezorLike | null>();

type WaitResult = {
  confirmed: boolean;
  timeouted?: boolean;
};
export async function waitConfirmOpenId(
  matches: Omit<IConfirmConnectTrezorLike, 'confirmed'>
): Promise<WaitResult> {
  const obs = confirmOpenSubj.asObservable().pipe(
    filter((payload) => payload?.confirmOpenId === matches.confirmOpenId),
    map((val) => {
      return {
        timeouted: false,
        confirmed:
          matches.confirmOpenId === val?.confirmOpenId && !!val.confirmed,
      };
    }),
    // startWith({
    //   timeouted: false,
    //   confirmed: false,
    // }),
    timeout(30 * 1e3),
    catchError(() => {
      return of({ confirmed: false, timeouted: true });
    })
  );

  return firstValueFrom(obs);
}

onIpcMainEvent('__internal_rpc:trezor-like:confirm-connect', (_, payload) => {
  confirmOpenSubj.next({
    confirmOpenId: payload.confirmOpenId,
    hardwareType: payload.hardwareType,
    confirmed: payload.confirmed,
  });
});
