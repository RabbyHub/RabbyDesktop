type RendererForwardMessageViewType = IBuiltinViewName | '*';

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
  ];
  response: ChannelForwardMessageType['send'];
};
