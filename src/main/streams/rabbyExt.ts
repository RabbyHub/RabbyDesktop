import { app } from 'electron';
import {
  IS_RUNTIME_PRODUCTION,
  RABBY_POPUP_GHOST_VIEW_URL,
} from '@/isomorphic/constants';
import { isRabbyXPage } from '@/isomorphic/url';
import { valueToMainSubject } from './_init';

import { cLog } from '../utils/log';
import { onIpcMainEvent, sendToWebContents } from '../utils/ipcMainEvents';
import { getRabbyExtId, onMainWindowReady } from '../utils/stream-helpers';
import { rabbyxQuery } from './rabbyIpcQuery/_base';
import { createPopupView } from '../utils/browser';

onIpcMainEvent('rabby-extension-id', async (event) => {
  event.reply('rabby-extension-id', {
    rabbyExtensionId: await getRabbyExtId(),
  });
});

onIpcMainEvent('__internal_rpc:rabbyx-rpc:query', async (evt, reqId, query) => {
  rabbyxQuery(query.method as any, query.params, reqId)
    .then((result) => {
      evt.reply('__internal_rpc:rabbyx-rpc:query', {
        reqId,
        result,
      });
    })
    .catch((error) => {
      evt.reply('__internal_rpc:rabbyx-rpc:query', {
        reqId,
        result: null,
        error,
      });
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
      '__internal_push:rabbyx:session-broadcast-forward-to-main',
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
        // webContents.openDevTools({ mode: 'detach', activate: true });
      }

      resolve(webContents);
    }
  });
});

Promise.all([maskReady, bgWcReady, rabbyxInitialized]).then(
  ([rabbyNotificationGasket, backgroundWebContents]) => {
    valueToMainSubject('rabbyExtViews', {
      rabbyNotificationGasket: rabbyNotificationGasket!,
      backgroundWebContents,
    });
  }
);

onIpcMainEvent(
  '__internal_rpc:rabbyx:waitExtBgGhostLoaded',
  async (evt, reqid) => {
    await bgWcReady;
    const extId = await getRabbyExtId();

    evt.reply('__internal_rpc:rabbyx:waitExtBgGhostLoaded', {
      reqid,
      rabbyxExtId: extId,
    });
  }
);
