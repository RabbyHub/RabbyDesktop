type RendererForwardMessageViewType = IBuiltinViewName | '*';

type ChannelForwardMessageType = {
  send: [
    | {
        targetView: RendererForwardMessageViewType & 'main-window';
        type: 'route-navigate';
        data: {
          pathname: string;
          params?: Record<string, string>;
        };
      }
    | {
        targetView: RendererForwardMessageViewType & '*';
        type: 'refreshCurrentAccount';
      }
    | {
        targetView: RendererForwardMessageViewType & 'add-address';
        type: 'nothing-but-reserved';
      }
    | {
        targetView: RendererForwardMessageViewType & 'address-management';
        type: 'nothing-but-reserved';
      }
    | {
        targetView: RendererForwardMessageViewType & 'quick-swap';
        type: 'nothing-but-reserved';
      }
    | {
        targetView: RendererForwardMessageViewType & 'dapps-management';
        type: 'nothing-but-reserved';
      }
  ];
  response: ChannelForwardMessageType['send'];
};
