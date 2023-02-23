/// <reference path="../../isomorphic/types.d.ts" />

import { app, screen, BrowserWindow } from 'electron';
import { Subject, debounceTime } from 'rxjs';
import Store from 'electron-store';
import {
  APP_NAME,
  IS_RUNTIME_PRODUCTION,
  PERSIS_STORE_PREFIX,
} from '../../isomorphic/constants';
import { safeParse, shortStringify } from '../../isomorphic/json';
import { FRAME_DEFAULT_SIZE } from '../../isomorphic/const-size';
import { emitIpcMainEvent, handleIpcMainInvoke } from '../utils/ipcMainEvents';
import { getWindowBoundsInWorkArea } from '../utils/screen';

export const desktopAppStore = new Store<{
  firstStartApp: IDesktopAppState['firstStartApp'];
  lastWindowPosition: {
    width: number;
    height: number;
    x?: number;
    y?: number;
    isMaximized?: boolean;
  };
  enableContentProtected: IDesktopAppState['enableContentProtected'];
  proxyType: ISensitiveConfig['proxyType'];
  proxySettings: ISensitiveConfig['proxySettings'];

  sidebarCollapsed: IDesktopAppState['sidebarCollapsed'];
}>({
  name: `${PERSIS_STORE_PREFIX}desktopApp`,

  cwd: app.getPath('userData').replace('Electron', APP_NAME),

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
      default: true,
    },
    sidebarCollapsed: {
      type: 'boolean',
      default: false,
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
});

function getState() {
  return {
    firstStartApp: desktopAppStore.get('firstStartApp'),
    enableContentProtected:
      desktopAppStore.get('enableContentProtected') !== false,
    sidebarCollapsed: desktopAppStore.get('sidebarCollapsed', false),
  };
}

export function isEnableContentProtected() {
  return desktopAppStore.get('enableContentProtected') !== false;
}

export function getAppProxyConf() {
  return {
    proxyType: desktopAppStore.get('proxyType'),
    proxySettings: desktopAppStore.get('proxySettings'),
  };
}

export function getAppProxyConfigForAxios() {
  const proxyConf = getAppProxyConf();
  return proxyConf.proxyType === 'custom'
    ? {
        protocol: proxyConf.proxySettings.protocol,
        host: proxyConf.proxySettings.hostname,
        port: proxyConf.proxySettings.port,
      }
    : undefined;
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
      case 'sidebarCollapsed': {
        const collapsed = !!value;
        desktopAppStore.set('sidebarCollapsed', !!value);
        emitIpcMainEvent(
          '__internal_main:mainwindow:sidebar-collapsed-changed',
          collapsed
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

export function getOrInitMainWinPosition(mainWin?: BrowserWindow) {
  const pos = desktopAppStore.get('lastWindowPosition');
  const mainBounds: Partial<Electron.Rectangle> | null = mainWin
    ? mainWin.getBounds()
    : null;

  const expectedBounds = getWindowBoundsInWorkArea({
    x: pos.x || mainBounds?.x || 0,
    y: pos.y || mainBounds?.y || 0,
    width: pos.width || mainBounds?.width || FRAME_DEFAULT_SIZE.width,
    height: pos.height || mainBounds?.height || FRAME_DEFAULT_SIZE.height,
  });

  if (mainWin) {
    if (!IS_RUNTIME_PRODUCTION) {
      console.debug(
        '[getOrInitMainWinPosition] expectedBounds',
        expectedBounds
      );
    }
    mainWin.setBounds(expectedBounds);
  }

  return expectedBounds;
}
