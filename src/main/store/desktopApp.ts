/// <reference path="../../isomorphic/types.d.ts" />

import { app, screen, BrowserWindow } from 'electron';
import { Subject, debounceTime } from 'rxjs';
import type { AxiosRequestConfig } from 'axios';

import { HttpsProxyAgent } from 'https-proxy-agent';
import { formatProxyServerURL } from '@/isomorphic/url';
import {
  DEFAULT_DAPPVIEW_ZOOM_PERCENT,
  FORCE_DISABLE_CONTENT_PROTECTION,
  PERSIS_STORE_PREFIX,
} from '../../isomorphic/constants';
import { safeParse, shortStringify } from '../../isomorphic/json';
import { FRAME_DEFAULT_SIZE } from '../../isomorphic/const-size';
import { emitIpcMainEvent, handleIpcMainInvoke } from '../utils/ipcMainEvents';
import { makeStore } from '../utils/store';
import { getSystemProxyInfo } from '../utils/systemConfig';

export const desktopAppStore = makeStore<{
  firstStartApp: IDesktopAppState['firstStartApp'];
  lastWindowPosition: {
    width: number;
    height: number;
    x?: number;
    y?: number;
    isMaximized?: boolean;
  };
  enableContentProtected: IDesktopAppState['enableContentProtected'];
  enableServeDappByHttp: IDesktopAppState['enableServeDappByHttp'];
  proxyType: ISensitiveConfig['proxyType'];
  proxySettings: ISensitiveConfig['proxySettings'];

  sidebarCollapsed: IDesktopAppState['sidebarCollapsed'];
  tipedHideMainWindowOnWindows: IDesktopAppState['tipedHideMainWindowOnWindows'];

  experimentalDappViewZoomPercent: IDesktopAppState['experimentalDappViewZoomPercent'];
}>({
  name: `${PERSIS_STORE_PREFIX}desktopApp`,

  schema: {
    firstStartApp: {
      type: 'boolean',
      default: true,
    },
    lastWindowPosition: {
      type: 'object',
      properties: {
        width: {
          type: 'number',
          default: FRAME_DEFAULT_SIZE.width,
        },
        height: {
          type: 'number',
          default: FRAME_DEFAULT_SIZE.height,
        },
        x: {
          type: 'number',
          default: undefined,
        },
        y: {
          type: 'number',
          default: undefined,
        },
        isMaximized: {
          type: 'boolean',
          default: false,
        },
      },
      default: {
        ...FRAME_DEFAULT_SIZE,
      },
    },
    enableContentProtected: {
      type: 'boolean',
      default: !FORCE_DISABLE_CONTENT_PROTECTION,
    },
    enableServeDappByHttp: {
      type: 'boolean',
      default: false,
    },
    sidebarCollapsed: {
      type: 'boolean',
      default: false,
    },
    tipedHideMainWindowOnWindows: {
      type: 'boolean',
      default: false,
    },
    experimentalDappViewZoomPercent: {
      type: 'number',
      default: DEFAULT_DAPPVIEW_ZOOM_PERCENT,
    },
    proxyType: {
      type: 'string',
      enum: ['none', 'system', 'custom'],
      default: 'system',
    },
    proxySettings: {
      type: 'object',
      properties: {
        protocol: {
          type: 'string',
          enum: ['socks5', 'http'],
        },
        hostname: {
          type: 'string',
        },
        port: {
          type: 'number',
        },
        username: {
          type: 'string',
        },
        password: {
          type: 'string',
        },
      },
      required: ['protocol', 'hostname', 'port'],
      default: {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: 1080,
        username: '',
        password: '',
      },
    },
  },

  serialize: shortStringify,

  deserialize: (data) => safeParse(data, {}),

  watch: true,

  migrations: {
    '>= 0.16.0': (store) => {
      if (typeof store.get('enableSupportIpfsDapp') === 'boolean') {
        store.set('enableServeDappByHttp', store.get('enableSupportIpfsDapp'));
        // @ts-expect-error
        store.delete('enableSupportIpfsDapp');
      }
    },
  },
});

// force disable it
if (FORCE_DISABLE_CONTENT_PROTECTION) {
  desktopAppStore.set('enableContentProtected', false);
}

function getState() {
  return {
    firstStartApp: desktopAppStore.get('firstStartApp'),
    enableContentProtected:
      desktopAppStore.get('enableContentProtected') !== false,
    enableServeDappByHttp:
      desktopAppStore.get('enableServeDappByHttp') === true,
    sidebarCollapsed: desktopAppStore.get('sidebarCollapsed', false),

    tipedHideMainWindowOnWindows: desktopAppStore.get(
      'tipedHideMainWindowOnWindows',
      false
    ),

    experimentalDappViewZoomPercent: desktopAppStore.get(
      'experimentalDappViewZoomPercent',
      DEFAULT_DAPPVIEW_ZOOM_PERCENT
    ),
  };
}

export function isEnableContentProtected() {
  return desktopAppStore.get('enableContentProtected') !== false;
}

export function isEnableServeDappByHttp() {
  return desktopAppStore.get('enableServeDappByHttp') === true;
}

function getAppProxyConf(): IAppProxyConf {
  return {
    proxyType: desktopAppStore.get('proxyType'),
    proxySettings: desktopAppStore.get('proxySettings'),
    systemProxySettings: undefined,
  };
}

export function getOptionProxyForAxios(
  proxyConf?: IAppProxyConf
): Exclude<AxiosRequestConfig['proxy'], false> {
  proxyConf = proxyConf || getAppProxyConf();

  if (proxyConf.proxyType === 'custom') {
    return {
      protocol: proxyConf.proxySettings.protocol,
      host: proxyConf.proxySettings.hostname,
      port: proxyConf.proxySettings.port,
    };
  }
  if (proxyConf.proxyType === 'system' && proxyConf.systemProxySettings) {
    return {
      protocol: proxyConf.systemProxySettings.protocol,
      host: proxyConf.systemProxySettings.host,
      port: proxyConf.systemProxySettings.port,
    };
  }

  return undefined;
}

export function getHttpsProxyAgentForRuntime(
  proxyConf?: IAppProxyConf
): AxiosRequestConfig['httpsAgent'] {
  proxyConf = proxyConf || getAppProxyConf();

  let httpsProxyAgent: HttpsProxyAgent | undefined;
  if (proxyConf.proxyType === 'custom') {
    httpsProxyAgent = new HttpsProxyAgent(
      formatProxyServerURL(proxyConf.proxySettings)
    );
  } else if (
    proxyConf.proxyType === 'system' &&
    proxyConf.systemProxySettings
  ) {
    httpsProxyAgent = new HttpsProxyAgent(
      formatProxyServerURL({
        protocol: proxyConf.systemProxySettings.protocol as 'http',
        hostname: proxyConf.systemProxySettings.host,
        port: proxyConf.systemProxySettings.port,
      })
    );
  }
  return httpsProxyAgent;
}

export async function getFullAppProxyConf(opts?: {
  refetchSystemProxyServer?: boolean;
}) {
  const appProxyConf = getAppProxyConf() as IPraticalAppProxyConf;

  appProxyConf.systemProxySettings = (
    await getSystemProxyInfo(opts?.refetchSystemProxyServer)
  ).systemProxySettings;

  let configForAxios: AxiosRequestConfig['proxy'];

  if (appProxyConf.proxyType === 'system') {
    configForAxios = appProxyConf.systemProxySettings;
  } else if (appProxyConf.proxyType === 'custom') {
    configForAxios = {
      protocol: appProxyConf.proxySettings.protocol,
      host: appProxyConf.proxySettings.hostname,
      port: appProxyConf.proxySettings.port,
    };
  }

  return {
    ...appProxyConf,
    configForAxios,
  };
}

export function getMainWindowDappViewZoomPercent() {
  return desktopAppStore.get(
    'experimentalDappViewZoomPercent',
    DEFAULT_DAPPVIEW_ZOOM_PERCENT
  );
}

handleIpcMainInvoke('get-desktopAppState', () => {
  desktopAppStore.set('firstStartApp', false);

  return {
    state: getState(),
  };
});

handleIpcMainInvoke('put-desktopAppState', (_, partialPayload) => {
  Object.entries(partialPayload).forEach(([key, value]) => {
    switch (key) {
      case 'enableContentProtected': {
        desktopAppStore.set('enableContentProtected', value !== false);
        emitIpcMainEvent('__internal_main:app:relaunch');
        break;
      }
      case 'enableServeDappByHttp': {
        desktopAppStore.set('enableServeDappByHttp', !!value);
        emitIpcMainEvent('__internal_main:app:relaunch');
        break;
      }
      case 'sidebarCollapsed': {
        const collapsed = !!value;
        desktopAppStore.set('sidebarCollapsed', !!value);
        emitIpcMainEvent(
          '__internal_main:mainwindow:sidebar-collapsed-changed',
          collapsed
        );
        break;
      }
      case 'experimentalDappViewZoomPercent': {
        desktopAppStore.set('experimentalDappViewZoomPercent', value);
        emitIpcMainEvent(
          '__internal_main:mainwindow:adjust-all-views-zoom-percent',
          value as number
        );
        break;
      }
      default:
        break;
    }
  });

  return {
    state: getState(),
  };
});

const mainWinPositionSubject = new Subject<BrowserWindow>();

const sub = mainWinPositionSubject
  .pipe(debounceTime(200))
  .subscribe((mainWin) => {
    if (mainWin.isDestroyed()) return;

    if (
      mainWin.isFullScreen() ||
      (mainWin.isMaximized() && process.platform === 'win32')
    ) {
      return;
    }

    const bounds = mainWin.getBounds();
    const prevValue = desktopAppStore.get('lastWindowPosition', {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      isMaximized: mainWin.isMaximized(),
    });
    const lastWindowPosition = {
      ...FRAME_DEFAULT_SIZE,
      width: bounds.width ?? prevValue.width,
      height: bounds.height ?? prevValue.height,
      x: bounds.x ?? prevValue.x,
      y: bounds.y ?? prevValue.y,
      isMaximized: mainWin.isMaximized(),
    };

    const scr = screen.getDisplayMatching({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    });

    /**
     * Btw, on darwin, electron would make sure the window is visible
     * as much as possible on screen. e.g. if the part of window is
     * out of screen, the window would be moved to make all of it visible.
     *
     * So in some degree, we don't need to check if the window is out of screen here,
     * but we still keep the logic here for safety.
     */
    lastWindowPosition.x = Math.max(0, lastWindowPosition.x);
    lastWindowPosition.x = Math.min(
      scr.workArea.x + scr.workArea.width,
      lastWindowPosition.x
    );

    lastWindowPosition.y = Math.max(0, lastWindowPosition.y);
    lastWindowPosition.y = Math.min(
      scr.workArea.y + scr.workArea.height,
      lastWindowPosition.y
    );

    desktopAppStore.set('lastWindowPosition', lastWindowPosition);
  });

app.on('quit', () => {
  sub.unsubscribe();
  mainWinPositionSubject.complete();
});

export function storeMainWinPosition(mainWin: BrowserWindow) {
  mainWinPositionSubject.next(mainWin);
}
