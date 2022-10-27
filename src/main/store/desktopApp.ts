/// <reference path="../../isomorphic/types.d.ts" />

import { app, screen, BrowserWindow } from 'electron';
import { Subject, debounceTime } from 'rxjs';
import Store from 'electron-store';
import { APP_NAME, PERSIS_STORE_PREFIX } from '../../isomorphic/constants';
import { safeParse, shortStringify } from '../../isomorphic/json';
import { FRAME_DEFAULT_SIZE } from '../../isomorphic/const-size';
import { onIpcMainEvent } from '../utils/ipcMainEvents';

export const desktopAppStore = new Store<{
  firstStartApp: boolean;
  lastWindowPosition: {
    width: number;
    height: number;
    x?: number;
    y?: number;
    isMaximized?: boolean;
  };
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
  },

  serialize: shortStringify,

  deserialize: (data) => safeParse(data, {}),

  watch: true,
});

onIpcMainEvent('get-desktopAppState', (event, reqid: string) => {
  desktopAppStore.set('firstStartApp', false);

  event.reply('get-desktopAppState', {
    reqid,
    state: {
      firstStartApp: desktopAppStore.get('firstStartApp'),
    },
  });
});

onIpcMainEvent('put-desktopAppState-hasStarted', (event, reqid: string) => {
  desktopAppStore.set('firstStartApp', false);

  event.reply('put-desktopAppState-hasStarted', {
    reqid,
  });
});

const mainWinPositionSubject = new Subject<BrowserWindow>();

const sub = mainWinPositionSubject
  .pipe(debounceTime(200))
  .subscribe((mainWin) => {
    if (mainWin.isDestroyed()) return;

    if (mainWin.isMaximized() || mainWin.isFullScreen()) {
      return;
    }

    const bounds = mainWin.getBounds();
    const prevValue = desktopAppStore.get('lastWindowPosition', {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
    });
    const lastWindowPosition = {
      ...FRAME_DEFAULT_SIZE,
      width: bounds.width ?? prevValue.width,
      height: bounds.height ?? prevValue.height,
      x: bounds.x ?? prevValue.x,
      y: bounds.y ?? prevValue.y,
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

  if (mainWin) {
    mainWin.setBounds({
      ...mainWin.getBounds(),
      ...pos,
    });
  }

  return pos;
}
