import { roundRectValue } from '@/isomorphic/shape';
import { randString } from '@/isomorphic/string';
import { canoicalizeDappUrl } from '@/isomorphic/url';
import {
  onIpcMainEvent,
  onIpcMainInternalEvent,
  onIpcMainSyncEvent,
  sendToWebContents,
} from '../utils/ipcMainEvents';
import { onMainWindowReady } from '../utils/stream-helpers';
import {
  createWindow,
  getTabbedWindowFromWebContents,
} from './tabbedBrowserWindow';

const SIZE = {
  width: 480,
  height: 220,
};

function getPromptWindowBounds(parentWindow: Electron.BrowserWindow) {
  const parentBounds = parentWindow.getBounds();
  const x = Math.round(
    parentBounds.x + parentBounds.width / 2 - SIZE.width / 2
  );
  const y = Math.round(
    parentBounds.y + parentBounds.height / 2 - SIZE.height / 2
  );

  return roundRectValue({ x, y, width: SIZE.width, height: SIZE.height });
}

const promptState: Record<
  string,
  {
    callerWindowId: number;
    callerWebContentsId: number;
    promptWindowId: number;
  }
> = {};

// TODO:
// 1. restrain only active tab run it
// 2. avoid repeative prompt in short time
onIpcMainSyncEvent('__internal_rpc:app:prompt-open', async (evt, options) => {
  const callerWebContents = evt.sender;
  const callerTabbedWin = getTabbedWindowFromWebContents(callerWebContents);

  if (!callerTabbedWin) {
    throw new Error(`Cannot find tabbed window from webContents`);
  }

  const promptId = randString();
  const alertTabbedWin = await createWindow({
    webuiType: 'Prompt',
    defaultTabUrl: `about:blank`,
    defaultOpen: false,
    queryStringArgs: { __webuiPromptId: promptId },
    windowType: 'popup',
    window: {
      modal: true,
      center: true,
      parent: callerTabbedWin.window,
      width: SIZE.width,
      height: SIZE.height,
      type: 'popup',
      resizable: false,
      maximizable: false,
      minimizable: false,
      fullscreen: false,
      movable: true,
    },
  });

  promptState[promptId] = {
    callerWindowId: callerTabbedWin.window.id,
    callerWebContentsId: callerWebContents.id,
    promptWindowId: alertTabbedWin.window.id,
  };

  const disposeOnConfirm = onIpcMainEvent(
    '__internal_rpc:app:prompt-confirm',
    (_, confirmPromptId, value) => {
      if (confirmPromptId !== promptId) return;

      // set returnValue for confirm;
      evt.returnValue = {
        promptId,
        returnValue: value,
      };
      disposeOnConfirm();

      alertTabbedWin.destroy();
    }
  );

  const disposeOnCancel = onIpcMainEvent(
    '__internal_rpc:app:prompt-cancel',
    (_, cancelPromptId) => {
      if (cancelPromptId !== promptId) return;

      // set returnValue for cancel;
      evt.returnValue = {
        promptId,
        returnValue: '',
      };
      disposeOnCancel();

      alertTabbedWin.destroy();
    }
  );

  const disposeOnError = onIpcMainEvent(
    '__internal_rpc:app:prompt-error',
    (_, errorPromptId) => {
      if (errorPromptId !== promptId) return;

      alertTabbedWin.destroy();
    }
  );

  // __internal_rpc:app:prompt-mounted
  const disposeOnMounted = onIpcMainEvent(
    '__internal_rpc:app:prompt-mounted',
    (_, queryPromptId) => {
      if (queryPromptId !== promptId) return;
      sendToWebContents(
        alertTabbedWin.window.webContents,
        '__internal_push:app:prompt-init',
        {
          promptId,
          data: {
            message: options?.message || '',
            originSite: canoicalizeDappUrl(options?.callerURL || '').origin,
            initInput: options?.defaultContent || '',
          },
        }
      );

      disposeOnMounted();
    }
  );

  alertTabbedWin.window.on('closed', () => {
    disposeOnConfirm();
    disposeOnCancel();
    disposeOnError();
    disposeOnMounted();
  });

  // alertTabbedWin.window.setMenu(null);
  // alertTabbedWin.window.setMenuBarVisibility(false);

  alertTabbedWin.window.setBounds(
    getPromptWindowBounds(callerTabbedWin.window)
  );
  alertTabbedWin.window.moveTop();

  alertTabbedWin.window.show();
});

onIpcMainInternalEvent('__internal_main:dev', async (payload) => {
  if (payload.type !== 'app:test-prompt') return;

  const mainTabbedWin = await onMainWindowReady();
  const callerWc =
    payload.callerWebContents || mainTabbedWin.window.webContents;

  if (!callerWc.isDevToolsOpened()) {
    callerWc.openDevTools({ mode: 'detach' });
  } else if (callerWc.isDevToolsFocused()) {
    callerWc.focus();
  }
  // callerWc.executeJavaScript(
  //   `window.rabbyDesktop.ipcRenderer.sendMessage('__internal_rpc:app:prompt-open');`
  // );
  callerWc.executeJavaScript(`window.prompt('Test Message');`);
});

// // just for debug
// onMainWindowReady().then((mainTabbedWin) => {
//   mainTabbedWin.window.webContents.openDevTools({ mode: 'detach' });
//   mainTabbedWin.window.webContents.executeJavaScript(
//     `window.rabbyDesktop.ipcRenderer.sendMessage('__internal_rpc:app:prompt-open');`
//   );
// });
