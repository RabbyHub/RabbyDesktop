import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { roundRectValue } from '@/isomorphic/shape';
import { randString } from '@/isomorphic/string';
import { canoicalizeDappUrl } from '@/isomorphic/url';
import { getTitlebarOffsetForMacOS } from '../utils/browser';
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
  width: 521,
  height: 231 + getTitlebarOffsetForMacOS(),
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

// TODO:
// 1. restrain only active tab run it
// 2. avoid repeative prompt in short time (consecutive prompt)
onIpcMainSyncEvent('__outer_rpc:app:prompt-open', async (evt, options) => {
  const callerWebContents = evt.sender;
  const callerTabbedWin = getTabbedWindowFromWebContents(callerWebContents);
  if (!callerTabbedWin) {
    throw new Error(`Cannot find tabbed window from webContents`);
  }

  const mainTabbedWin = await onMainWindowReady();

  if (callerWebContents === mainTabbedWin.window.webContents) {
    throw new Error(`Cannot open prompt from mainWindow`);
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
      movable: false,
      show: false,
    },
  });
  alertTabbedWin.window.setBounds(
    getPromptWindowBounds(callerTabbedWin.window)
  );

  const disposeOnConfirm = onIpcMainEvent(
    '__internal_rpc:app:prompt-confirm',
    (_, confirmPromptId, value) => {
      if (confirmPromptId !== promptId) return;

      // set returnValue for confirm;
      evt.returnValue = {
        promptId,
        value,
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
        value: null,
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

  if (IS_RUNTIME_PRODUCTION) {
    alertTabbedWin.window.webContents.openDevTools({ mode: 'detach' });
  }

  alertTabbedWin.window.on('closed', () => {
    disposeOnConfirm();
    disposeOnCancel();
    disposeOnError();
    disposeOnMounted();
  });

  // alertTabbedWin.window.setMenu(null);
  // alertTabbedWin.window.setMenuBarVisibility(false);
  alertTabbedWin.window.moveTop();

  alertTabbedWin.window.show();
});

onIpcMainInternalEvent('__internal_main:dev', async (payload) => {
  if (payload.type !== 'app:test-prompt') return;

  const mainTabbedWin = await onMainWindowReady();
  const callerWc =
    payload.callerWebContents || mainTabbedWin.window.webContents;

  // if (!IS_RUNTIME_PRODUCTION) {
  //   if (!callerWc.isDevToolsOpened()) {
  //     callerWc.openDevTools({ mode: 'detach' });
  //   } else if (callerWc.isDevToolsFocused()) {
  //     callerWc.focus();
  //   }
  // }

  callerWc.executeJavaScript(`window.prompt('prompt from dapp');`);
});
