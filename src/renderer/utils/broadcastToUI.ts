import eventBus from '@/renderer/utils-shell/eventBus';
import { AllBackgroundStores } from './backgroundStore';

/**
 * @description event would be broadcasted to ALL connected wallet
 *
 * notice never send sensitive data in this event
 * */
export const enum BROADCAST_TO_UI_EVENTS {
  storeChanged = 'storeChanged',
}

export type BROADCAST_TO_UI_EVENTS_PAYLOAD = {
  [BROADCAST_TO_UI_EVENTS.storeChanged]: {
    bgStoreName: string;
    changedKey: string;
    changedKeys: string[];
    partials: Record<string, any>;
  };
};

export type IDisposeFunc = () => any;

export function runBroadcastDispose<T extends IDisposeFunc>(dispose: T | T[]) {
  const disposeList = Array.isArray(dispose) ? dispose : [dispose];

  disposeList.forEach((d) => d.apply(null, []));
}

export function onBroadcastToUI<T extends BROADCAST_TO_UI_EVENTS>(
  event: T,
  listener: (payload: BROADCAST_TO_UI_EVENTS_PAYLOAD[T]) => void
): IDisposeFunc {
  eventBus.addEventListener(event, listener);

  return () => {
    eventBus.removeEventListener(event, listener);
  };
}

export function onBackgroundStoreChanged<S extends keyof AllBackgroundStores>(
  bgStoreName: S,
  listener: (
    payload: Omit<
      BROADCAST_TO_UI_EVENTS_PAYLOAD['storeChanged'],
      'partials' | 'changedKeys'
    > & {
      bgStoreName: S;
      changedKey: keyof AllBackgroundStores[S];
      changedKeys: (keyof AllBackgroundStores[S])[];
      partials: Partial<AllBackgroundStores[S]>;
    }
  ) => void
) {
  return onBroadcastToUI(BROADCAST_TO_UI_EVENTS.storeChanged, (payload) => {
    if (payload?.bgStoreName !== bgStoreName) return;

    listener?.(payload as any);
  });
}
