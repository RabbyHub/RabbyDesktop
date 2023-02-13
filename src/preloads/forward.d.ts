/// <reference path="../isomorphic/type-helpers.d.ts" />

type RendererForwardMessageViewType = IBuiltinViewName | '*';

type SVState<T extends object> = { visible: boolean } & {
  state?: T;
};

type ZViewStates = {
  'switch-chain': {
    dappTabInfo: {
      id: chrome.tabs.Tab['id'];
      url: chrome.tabs.Tab['url'];
    };
  };
};

type IZPopupSubviewState = {
  [K in keyof ZViewStates]: SVState<NullableFields<ZViewStates[K]>>;
};

type ChannelForwardMessageType = {
  send: [
    | {
        targetView: 'main-window';
        type: 'route-navigate';
        data: {
          pathname: string;
          params?: Record<string, string>;
        };
      }
    | {
        targetView: 'main-window';
        type: 'open-dapp';
        data: {
          dappURL: string;
        };
      }
    | {
        targetView: '*';
        type: 'refreshCurrentAccount';
      }
    | {
        targetView: 'add-address';
        type: 'nothing-but-reserved';
      }
    | {
        targetView: 'address-management';
        type: 'nothing-but-reserved';
      }
    | {
        targetView: 'quick-swap';
        type: 'nothing-but-reserved';
      }
    | {
        targetView: 'dapps-management';
        type: 'nothing-but-reserved';
      }
    | {
        targetView: 'z-popup';
        type: 'update-subview-state';
        partials?: Partial<IZPopupSubviewState>;
      }
  ];
  response: ChannelForwardMessageType['send'];
};
