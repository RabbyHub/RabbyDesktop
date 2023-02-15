/// <reference path="../isomorphic/type-helpers.d.ts" />

type CHAINS_ENUM = import('@debank/common').CHAINS_ENUM;

type RendererForwardMessageViewType = IBuiltinViewName | '*';

type SVState<T extends object> = { visible: boolean } & {
  state?: T;
};

type ZViewStates = {
  'switch-chain': {
    value?: CHAINS_ENUM;
    title?: string;
    supportChains?: CHAINS_ENUM[];
    disabledTips?: string;
  };
  'security-notification': ISecurityNotificationPayload;
  'add-address-dropdown': {
    pos: {
      x: number;
      y: number;
    };
  };
  'add-address-modal': {
    keyringType: string;
  };
};

type IZPopupSubviewState = {
  [K in keyof ZViewStates]: SVState<ZViewStates[K]>;
};

type IZCallbackPayload<SV extends keyof ZViewStates> = {
  svOpenId: string;
  subView: SV;
  latestState: IZPopupSubviewState[SV]['state'];
  $subViewState: IZPopupSubviewState[SV];
};

type ChannelForwardMessageType =
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
      targetView: 'dapps-management';
      type: 'nothing-but-reserved';
    }
  | {
      targetView: 'z-popup';
      type: 'update-subview-state';
      partials?: Partial<IZPopupSubviewState>;
    }
  | {
      targetView: 'z-popup';
      type: 'register-subview-openid';
      payload: {
        svOpenId: string;
        subView: keyof ZViewStates;
      };
    }
  | {
      targetView: 'main-window' | 'z-popup';
      type: 'consume-subview-openid';
      payload: IZCallbackPayload<keyof ZViewStates>;
    };
