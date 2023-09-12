/// <reference path="../isomorphic/type-helpers.d.ts" />

type CHAINS_ENUM = import('@debank/common').CHAINS_ENUM;
type IDisplayedAccountWithBalance =
  import('@/renderer/hooks/rabbyx/useAccountToDisplay').IDisplayedAccountWithBalance;

type RendererForwardMessageViewType = IBuiltinViewName | '*';

type SVState<T extends object> = { visible: boolean } & {
  state?: T;
};

type ITriggerTooltipOnGhost = {
  triggerId: string;
  triggerElementRect?: DOMRectValues;
  tooltipProps?: Omit<
    import('antd').TooltipProps,
    'title' | 'overlay' | 'openOpenChange'
  > & {
    title?: string;
  };
  extraData?: {
    specialType: 'detect-dapp';
  };
};

type ZViewStates = {
  'switch-chain': {
    value?: CHAINS_ENUM;
    title?: string;
    supportChains?: CHAINS_ENUM[];
    disabledTips?: string;
    isCancel?: boolean;
    isShowCustomRPC?: boolean;
    isCheckCustomRPC?: boolean;
  };
  'security-notification': ISecurityNotificationPayload;
  'add-address-modal': {
    keyringType: string;
    showEntryButton?: boolean;
    showBackButton?: boolean;
    brand?: import('@/renderer/utils/constant').WALLET_BRAND_TYPES;
  };
  'address-management': {
    hidden?: boolean;
  };
  'address-detail': {
    account: IDisplayedAccountWithBalance;
    backable?: boolean;
  };
  'select-add-address-type-modal': {
    showEntryButton?: boolean;
  };
  /* eslint-disable @typescript-eslint/ban-types */
  'gasket-modal-like-window': {};
  /* eslint-enable @typescript-eslint/ban-types */

  'rename-dapp-modal': {
    dapp: IDapp;
  };

  'delete-dapp-modal': {
    dapp: IDapp;
  };

  'safe-queue-modal': {
    // nothing
  };

  'toast-zpopup-message': {
    message?: React.ReactNode;
    type?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
  };

  'ipfs-add-failed-modal': {
    // nothing
  };

  'ipfs-no-local-modal': {
    // nothing
  };

  'ipfs-verify-failed-modal': {
    // nothing
  };

  'modal-dapp-type-not-supported': {
    tipType?: IValidDappType;
  };

  'trezor-like-cannot-use': ITrezorLikeCannotUserReason;
};

type IZPopupSubviewState = {
  [K in keyof ZViewStates]: SVState<ZViewStates[K]>;
};

type IZPopupSubviewVisibleState = {
  [K in keyof ZViewStates]: boolean;
};

type IZCallbackPayload<SV extends keyof ZViewStates> = {
  svOpenId: string;
  subView: SV;
  latestState: IZPopupSubviewState[SV]['state'];
  $subViewState: IZPopupSubviewState[SV];
  // $zViewsStates: NullableFields<IZPopupSubviewState>;
  $zViewsStatesVisible: IZPopupSubviewVisibleState;
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
      targetView: 'main-window';
      type: 'toast-on-mainwin';
      data: {
        type: 'ledger-connect-failed';
        message?: string;
      };
    }
  | {
      targetView: 'main-window';
      type: 'on-deleted-account';
    }
  // | {
  //   targetView: 'main-window';
  //   type: 'z-view-states-changed';
  //   nextStates: NullableFields<IZPopupSubviewState>;
  // }
  | {
      targetView: 'main-window';
      type: 'z-views-visible-changed';
      nextVisibles: IZPopupSubviewVisibleState;
    }
  | {
      targetView: '*';
      type: 'refreshAccountList';
    }
  | {
      targetView: '*';
      type: 'refreshCurrentAccount';
    }
  | {
      targetView: '*';
      type: 'refreshConnectedSiteMap';
    }
  | {
      targetView: 'main-window';
      type: 'toast-message';
      payload: {
        data: {
          type: string;
          content: string;
          duration?: number;
        };
      };
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
  // | {
  //     targetView: 'top-ghost-window';
  //     type: 'open-antd-message';
  //     payload: {
  //       triggerElementRect?: Omit<DOMRectReadOnly, 'toJSON'>;
  //       openMessageArgs?: Omit<
  //         import('antd/lib/message').ArgsProps,
  //         'content' | 'icon'
  //       > & {
  //         iconSrc?: string;
  //         content: string;
  //       };
  //     };
  //   }
  | {
      targetView: 'top-ghost-window';
      type: 'trigger-tooltip';
      payload: ITriggerTooltipOnGhost;
    }
  | {
      targetView: 'top-ghost-window';
      type: 'report-special-tooltip';
      payload: {
        type: 'new-version-updated';
        rect: DOMRectValues | null;
      };
    }
  | {
      targetView: 'top-ghost-window' | 'main-window';
      type: 'debug:toggle-highlight';
      payload: {
        isHighlight?: boolean;
      };
    }
  | {
      targetView: 'z-popup';
      type: 'hardward-conn-window-opened-changed';
      payload: {
        type: HDManagerType;
        opened: boolean;
      };
    }
  | {
      targetView: '*' | 'main-window' | 'z-popup';
      type: 'consume-subview-openid';
      payload: IZCallbackPayload<keyof ZViewStates>;
    };

type ForwardMessageViewTypes = {
  [K in ChannelForwardMessageType['targetView']]: (ChannelForwardMessageType & {
    targetView: K;
  })['type'];
};
