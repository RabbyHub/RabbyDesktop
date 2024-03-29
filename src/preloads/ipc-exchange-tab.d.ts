type WebviewTagExchgMatches = {
  /**
   * @description uniq id
   */
  tabUid: string;
  windowId: number;
};

type WebviewTagCreatedEventPayload = WebviewTagExchgMatches & {
  needClearHistory: boolean;
};

type WebViewExChgData<T = any> = T extends void
  ? WebviewTagExchgMatches
  : WebviewTagExchgMatches & T;

type ChannelPushToWebContentsForWebviewTabs = {
  '__internal_push:tabbed-window2:create-webview': WebViewExChgData<{
    // for mainWindow
    relatedDappId?: string;
    additionalData: {
      preloadPath: string;
      blankPage: string;
    };
    tabMeta: {
      initDetails?: Partial<chrome.tabs.CreateProperties>;
      webuiType?: IShellWebUIType;
      relatedDappId?: string;
    };
  }>;

  '__internal_push:tabbed-window2:show-webview': WebViewExChgData<{
    isDappWebview: boolean;
    viewBounds: Electron.Rectangle;
  }>;

  // eslint-disable-next-line @typescript-eslint/ban-types
  '__internal_push:tabbed-window2:hide-webview': WebViewExChgData<{}>;

  // eslint-disable-next-line @typescript-eslint/ban-types
  '__internal_push:tabbed-window2:destroy-webview': WebViewExChgData<{}>;

  // '__internal_push:tabbed-window2:tab-updated': {
  //   windowId: number;
  // }[];
  '__internal_push:tabbed-window2:set-dapp-tabwebview-zoom': {
    zoomPercent: number;
    tabWebviewUIDs: string[];
  };
};

type ChannelInvokeForWebviewTabs = {
  '__internal_rpc:tabbed-window2:created-webview': {
    send: [
      WebViewExChgData<{
        tabWebContentsId: number;
      }>
    ];
    response: void;
  };
};
