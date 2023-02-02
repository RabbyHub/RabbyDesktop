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
    send: [];
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
            tabId: number;
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
  '__internal_main:popupwin-on-mainwin:toggle-show': {
    send: [
      | {
          type: IContextMenuPageInfo['type'];
          nextShow: true;
          rect: {
            x: Electron.Point['x'];
            y: Electron.Point['y'];
            width?: number;
            height?: number;
          };
          pageInfo: IContextMenuPageInfo;
          openDevTools?: boolean;
        }
      | {
          nextShow: false;
          type: IContextMenuPageInfo['type'];
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
          viewType: 'base' | 'safe';
        }
      | {
          type: 'loading-view:inspect';
        }
      | {
          type: 'rabbyx-sign-gasket:toggle-show';
          nextShow: boolean;
        }
    ];
    response: [];
  };
  '__internal_main:app:reset-app': {
    send: [];
    response: [];
  };
  '__internal_main:app:relaunch': {
    send: [];
    response: [];
  };
};

type MainInternals = keyof MainInternalsMessagePayload;
