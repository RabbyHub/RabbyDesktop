type MainInternalsMessagePayload = {
  '__internal_main:tabbed-window:view-added': {
    send: [
      {
        webContents: Electron.WebContents;
        window: Electron.BrowserWindow;
        tabbedWindow?: any;
      }
    ];
    response: [];
  };
  '__internal_main:tabbed-window:tab-favicon-updated': {
    send: [
      {
        dappOrigin: string;
        favicons: string[];
      }
    ];
    response: [];
  };
  '__internal_main:dapps:changed': {
    send: [
      {
        dapps?: IDapp[];
        pinnedList?: IDapp['origin'][];
        unpinnedList?: IDapp['origin'][];
        protocolDappsBinding?: IProtocolDappBindings;
      }
    ];
    response: [];
  };
  '__internal_main:mainwindow:show': {
    send: [isInitMainWindow?: boolean];
    response: [];
  };
  '__internal_main:mainwindow:toggle-loading-view': {
    send: [
      payload:
        | {
            type: 'show';
            tabId: number;
            tabURL: string;
            dapp?: IDapp | null;
          }
        | {
            type: 'hide';
          }
    ];
    response: [];
  };
  '__internal_main:mainwindow:sidebar-collapsed-changed': {
    send: [collapsed: boolean];
    response: [];
  };
  '__internal_main:mainwindow:toggle-animating': {
    send: [animating: boolean];
    response: [];
  };
  '__internal_main:mainwindow:capture-tab': {
    send: [
      payload?: {
        type?: 'clear';
      }
    ];
    response: [];
  };
  '__internal_main:popupview-on-mainwin:toggle-show': {
    send: [
      | {
          type: PopupViewOnMainwinInfo['type'];
          nextShow: true;
          pageInfo: PopupViewOnMainwinInfo;
          openDevTools?: boolean;
        }
      | {
          nextShow: false;
          type: PopupViewOnMainwinInfo['type'];
        }
    ];
    response: [];
  };
  '__internal_main:views:channel-message': {
    send: [ChannelForwardMessageType];
    response: [];
  };
  '__internal_main:popupwin-on-mainwin:toggle-show': {
    send: [
      | {
          type: IPopupWinPageInfo['type'];
          nextShow: true;
          rect: {
            x: Electron.Point['x'];
            y: Electron.Point['y'];
            width?: number;
            height?: number;
          };
          pageInfo: IPopupWinPageInfo;
          openDevTools?: boolean;
        }
      | {
          nextShow: false;
          type: IPopupWinPageInfo['type'];
        }
    ];
    response: [];
  };
  '__internal_main:tabbed-window:destroyed': {
    send: [windowId: Electron.BrowserWindow['id']];
    response: [];
  };
  '__internal_main:dev': {
    send: [
      | {
          type: 'dapp-safe-view:open';
        }
      | {
          type: 'dapp-safe-view:inspect';
          viewType: 'base';
        }
      | {
          type: 'loading-view:inspect';
        }
      | {
          type: 'rabbyx-sign-gasket:toggle-show';
          nextShow: boolean;
        }
      | {
          type: 'app:test-prompt';
          callerWebContents?: Electron.WebContents;
        }
    ];
    response: [];
  };
  '__internal_main:app:reset-app': {
    send: [];
    response: [];
  };
  '__internal_main:app:reset-rabbyx-approvals': {
    send: [];
    response: [];
  };
  '__internal_main:app:relaunch': {
    send: [];
    response: [];
  };
  '__internal_main:app:close-tab-on-del-dapp': {
    send: [dappOrigin: string | string[]];
    response: [];
  };
  '__internal_main:mainwindow:dapp-tabs-to-be-closed': {
    send: [
      {
        tabs: ItOrItsArray<{
          tabId?: number[];
          finalURL: string;
        }>;
      }
    ];
    response: [];
  };
};

type MainInternals = keyof MainInternalsMessagePayload;
