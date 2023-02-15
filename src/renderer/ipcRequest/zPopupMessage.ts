import { arraify } from '@/isomorphic/array';
import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { randString } from '@/isomorphic/string';
import { isBuiltinView } from '@/isomorphic/url';

type ChannelForwardMessagePayload = ChannelForwardMessageType['send'][0];
function onMessageForwarded<
  T extends Pick<ChannelForwardMessagePayload, 'type' | 'targetView'>
>(
  matches: T | T[],
  callback: (payload: ChannelForwardMessagePayload & T) => void
) {
  const matchList = arraify(matches);

  return window.rabbyDesktop.ipcRenderer.on(
    '__internal_forward:views:channel-message',
    (payload) => {
      matchList.forEach((matchItem) => {
        const { targetView, type } = matchItem;

        if (!isBuiltinView(window.location.href, targetView)) return;

        if (payload.type === type) {
          callback(payload as any);
        }
      });
    }
  );
}

export type IZCallback<V extends keyof ZViewStates> = (
  payload: IZCallbackPayload<V>
) => any;
const zPopupCallbacks: {
  [K in string]?: {
    subView: keyof ZViewStates;
    callback: IZCallback<keyof ZViewStates>;
  } | null;
} = {};

export function registerZCallback<V extends keyof ZViewStates>(
  subView: V,
  callback?: IZCallback<V>
) {
  const svOpenId = randString();

  if (typeof callback === 'function') {
    zPopupCallbacks[svOpenId] = {
      subView,
      callback: callback as any,
    };
  }

  return { svOpenId };
}

onMessageForwarded(
  [
    { targetView: 'main-window', type: 'consume-subview-openid' },
    { targetView: 'z-popup', type: 'consume-subview-openid' },
  ],
  ({ payload }) => {
    if (!IS_RUNTIME_PRODUCTION) {
      console.debug(
        '[debug] onMessageForwarded::consume-subview-openid:: payload',
        payload
      );
    }
    if (
      payload?.svOpenId &&
      zPopupCallbacks[payload.svOpenId]?.subView === payload.subView
    ) {
      zPopupCallbacks[payload.svOpenId]?.callback(payload);
      zPopupCallbacks[payload.svOpenId] = null;
    }
  }
);

const zPopupCallbackIds: {
  [K in string]?: string;
} = {};
onMessageForwarded(
  { targetView: 'z-popup', type: 'register-subview-openid' },
  ({ payload }) => {
    if (!IS_RUNTIME_PRODUCTION) {
      console.debug(
        '[debug] onMessageForwarded::register-subview-openid:: payload',
        payload
      );
    }
    if (payload?.svOpenId) {
      zPopupCallbackIds[payload.subView] = payload.svOpenId;
    }
  }
);

export function consumeZCallback<V extends keyof ZViewStates>(subView: V) {
  const svOpenId = zPopupCallbackIds[subView];
  if (!IS_RUNTIME_PRODUCTION) {
    console.debug('[debug] consumeZCallback:: svOpenId', svOpenId);
  }
  delete zPopupCallbackIds[subView];

  return svOpenId;
}
