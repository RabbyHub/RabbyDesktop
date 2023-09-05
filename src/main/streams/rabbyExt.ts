import { app } from 'electron';
import {
  IS_RUNTIME_PRODUCTION,
  RABBY_POPUP_GHOST_VIEW_URL,
} from '@/isomorphic/constants';
import { isRabbyXPage } from '@/isomorphic/url';
import { randString } from '@/isomorphic/string';
import { valueToMainSubject } from './_init';

import { cLog } from '../utils/log';
import {
  handleIpcMainInvoke,
  onIpcMainEvent,
  onIpcMainInternalEvent,
  sendToWebContents,
} from '../utils/ipcMainEvents';
import {
  getRabbyExtId,
  onMainWindowReady,
  __internalToggleRabbyxGasketMask,
} from '../utils/stream-helpers';
import { rabbyxExecuteJs, rabbyxQuery } from './rabbyIpcQuery/_base';
import { createPopupView } from '../utils/browser';
import { getMainProcessAppChannel } from '../utils/app';

onIpcMainEvent('rabby-extension-id', async (event) => {
  event.reply('rabby-extension-id', {
    rabbyExtensionId: await getRabbyExtId(),
  });
});

handleIpcMainInvoke('__internal_rpc:rabbyx-rpc:query', async (_, query) => {
  const reqId = randString();

  return rabbyxQuery(query.method as any, query.params, reqId)
    .then((result) => {
      return {
        reqId,
        result,
      };
    })
    .catch((error) => {
      return {
        result: null,
        error,
      };
    });
});

onIpcMainEvent(
  '__internal_rpc:rabbyx:on-session-broadcast',
  async (_, payload) => {
    const tabbedWin = await onMainWindowReady();
    // TODO: leave here for debug
    // console.log('[debug] payload', payload);

    // forward to main window
    sendToWebContents(
      tabbedWin.window.webContents,
      '__internal_push:rabbyx:session-broadcast-forward-to-desktop',
      payload
    );

    switch (payload.event) {
      case 'rabby:chainChanged': {
        break;
      }
      case 'lock': {
        break;
      }
      case 'unlock': {
        break;
      }
      default:
        break;
    }
  }
);

const maskReady = getRabbyExtId().then(async () => {
  const rabbyNotificationGasket = createPopupView();
  rabbyNotificationGasket.setBounds({ x: -100, y: -100, width: 1, height: 1 });

  await rabbyNotificationGasket.webContents.loadURL(
    `${RABBY_POPUP_GHOST_VIEW_URL}#/rabby-notification-gasket`
  );

  return rabbyNotificationGasket;
});

const blankPageReady = getRabbyExtId().then(async () => {
  const rabbyxBlankPage = createPopupView();
  rabbyxBlankPage.setBounds({ x: -100, y: -100, width: 1, height: 1 });

  const rabbyExtId = await getRabbyExtId();
  await rabbyxBlankPage.webContents.loadURL(
    `chrome-extension://${rabbyExtId}/blank.html`
  );

  if (!IS_RUNTIME_PRODUCTION) {
    // rabbyxBlankPage.webContents.openDevTools({
    //   mode: 'detach',
    //   activate: true,
    // });
  }

  return rabbyxBlankPage;
});

const rabbyxInitialized = new Promise<number>((resolve) => {
  const dispose = onIpcMainEvent('rabbyx-initialized', (_, time) => {
    dispose();
    cLog('rabbyx-initialized', time);
    resolve(time);
  });
});

const bgWcReady = new Promise<Electron.WebContents>((resolve) => {
  app.on('web-contents-created', async (_, webContents) => {
    const type = webContents.getType();
    const wcUrl = webContents.getURL();
    cLog(
      `'web-contents-created' event [id: ${webContents.id}, type:${type}, url:${wcUrl}]`
    );

    if (type !== 'backgroundPage') return;

    let retUrl = '';
    try {
      retUrl = await webContents.executeJavaScript(`window.location.href;`);
      cLog(`backgroundPage of extension '${retUrl}' opened`);
      // eslint-disable-next-line no-empty
    } catch (e) {}

    if (!retUrl) return;

    const extId = await getRabbyExtId();
    // we should make sure the webContents is the background page of rabby extension
    if (isRabbyXPage(retUrl, extId, 'background')) {
      if (!IS_RUNTIME_PRODUCTION) {
        webContents.openDevTools({ mode: 'detach', activate: true });
      }

      resolve(webContents);
    }
  });
});

Promise.all([maskReady, bgWcReady, blankPageReady, rabbyxInitialized]).then(
  ([rabbyNotificationGasket, backgroundWebContents, rabbyxBlankPage]) => {
    valueToMainSubject('rabbyExtViews', {
      rabbyNotificationGasket: rabbyNotificationGasket!,
      backgroundWebContents,
      rabbyxBlankPage,
    });
  }
);

handleIpcMainInvoke(
  '__internal_invoke:rabbyx:waitExtBgGhostLoaded',
  async () => {
    return {
      rabbyxExtId: await getRabbyExtId(),
    };
  }
);

onIpcMainInternalEvent('__internal_main:dev', async (payload) => {
  switch (payload.type) {
    case 'rabbyx-sign-gasket:toggle-show': {
      __internalToggleRabbyxGasketMask(payload.nextShow);
      break;
    }
    default:
      break;
  }
});

handleIpcMainInvoke('rabbyx:get-app-version', (_) => {
  return {
    version: app.getVersion(),
    appChannel: getMainProcessAppChannel(),
  };
});

handleIpcMainInvoke('get-rabbyx-info', async (evt) => {
  const rabbyxExtId = await getRabbyExtId();
  const currentURL = evt.sender.getURL();

  if (isRabbyXPage(currentURL, rabbyxExtId)) {
    return { rabbyxExtId, requesterIsRabbyx: true, userId: undefined };
  }

  const result = await rabbyxExecuteJs<{ extensionId?: string } | null>(`
  ;(async () => {
    const result = await new Promise((resolve) => {
      chrome.storage.local.get('extensionId', function(res) {
        resolve(res);
      });
    });

    return result;
  })();
  `);

  return {
    rabbyxExtId,
    requesterIsRabbyx: false,
    userId: result?.extensionId,
  };
});
