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
  '__internal_main:dapps:pinnedListChanged': {
    send: [pinnedList: IDapp['origin'][]];
    response: [];
  };
  '__internal_main:mainwindow:tab-loading-changed': {
    send: [
      payload:
        | {
            type: 'before-load';
            url: string;
            tabId: number;
          }
        | {
            type: 'did-finish-load';
            tabId: number;
          }
    ];
  };
  '__internal_main:mainwindow:toggle-loading-view': {
    send: [
      payload:
        | {
            type: 'start';
            tabId?: number;
            dapp: IDapp;
          }
        | {
            type: 'did-finish-load';
            tabId?: number;
          }
    ];
    response: [];
  };
  '__internal_main:mainwindow:sidebar-collapsed-changed': {
    send: [collapsed: boolean];
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
