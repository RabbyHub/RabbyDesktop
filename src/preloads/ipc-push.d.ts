// eslint-disable-next-line @typescript-eslint/ban-types
type ChannelPushToWebContents = {
  '__internal_push:app:prompt-init': {
    promptId: string;
    data?: {
      message?: string;
      originSite?: string;
      initInput?: string;
    };
  };
  '__internal_push:mainwindow:update-findresult-in-page': {
    tabId: number;
    find: {
      searchText: string;
      result: Electron.Result | null;
    };
  };
  '__internal_push:mainwindow:opened-dapp-tab': {
    dappId: string;
    dappOrigin: string;
    tabId?: number;
  };
  '__internal_push:dapps:changed': MainInternalsMessagePayload['__internal_main:dapps:changed']['send'][0];
};
