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
    ];
    response: [];
  };
  '__internal_main:app:reset-app': {
    send: [];
    response: [];
  };
};

type MainInternals = keyof MainInternalsMessagePayload;
