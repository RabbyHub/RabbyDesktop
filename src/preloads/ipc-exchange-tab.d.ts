type WebviewTagExchgMatches = {
  /**
   * @description uniq id
   */
  tabUid: string;
  windowId: number;
};

type WebViewExChgData<T> = WebviewTagExchgMatches & T;

type ChannelPushToWebContentsForWebviewTabs = {
  '__internal_push:tabbed-window2:create-webview': WebViewExChgData<{
    // for mainWindow
    relatedDappId?: string;
    additionalData: {
      preloadPath: string;
      blankPage: string;
    };
  }>;

  '__internal_push:tabbed-window2:show-webview': WebViewExChgData<{
    viewBounds: Electron.Rectangle;
  }>;

  // eslint-disable-next-line @typescript-eslint/ban-types
  '__internal_push:tabbed-window2:hide-webview': WebViewExChgData<{}>;

  // eslint-disable-next-line @typescript-eslint/ban-types
  '__internal_push:tabbed-window2:destroy-webview': WebViewExChgData<{}>;
};

type ChannelInvokeForWebviewTabs = {
  '__internal_rpc:tabbed-window2:created-webview': {
    send: [
      WebViewExChgData<{
        webviewTagWebContentsId: number;
      }>
    ];
    response: void;
  };
};
