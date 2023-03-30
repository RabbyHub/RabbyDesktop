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
        matchedRelatedDappId: IDapp['id'];
        matchedType: import('@/isomorphic/constants').EnumMatchDappType;
        linkRelIcons: ISiteMetaData['linkRelIcons'];
        favicons: ISiteMetaData['favicons'];
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
        dappBoundTabIds?: IDappBoundTabIds;
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
  '__internal_main:tabbed-window:tab-destroyed': {
    send: [
      info: {
        windowId: Electron.BrowserWindow['id'];
        tabId: Electron.WebContents['id'];
      }
    ];
    response: [];
  };
  '__internal_main:tabbed-window:tab-selected': {
    send: [
      info: {
        windowId: Electron.BrowserWindow['id'];
        tabId: Electron.WebContents['id'];
      }
    ];
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
  '__internal_main:mainwindow:toggle-indappfind-show': {
    send: [show: boolean, tabId: number];
  };
  '__internal_main:mainwindow:op-find-in-page': {
    send: [
      | {
          type: 'start-find';
        }
      | {
          type: 'update-search-token';
          token: string;
        }
      | {
          type: 'find-forward';
        }
      | {
          type: 'find-backward';
          // } | {
          //   type: 'clear-search',
        }
      | {
          type: 'stop-find';
        }
    ];
    response: [];
  };
  '__internal_main:mainwindow:update-findresult-in-page': {
    send: [
      ChannelPushToWebContents['__internal_push:mainwindow:update-findresult-in-page']
    ];
    response: [];
  };
};

type MainInternals = keyof MainInternalsMessagePayload;
