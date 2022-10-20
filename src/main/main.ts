/// <reference path="../renderer/preload.d.ts" />

import './store/dapps';
import './store/desktopApp';

import './controller/tab';

import './streams/tabbedBrowserWindow';
import './streams/rabbyExt';
import './streams/updater';
import './streams/session';
import './streams/dappAlert';
import './streams/securityCheck';
import './streams/securityNotification';
import './streams/clipboard';
import './streams/browser';

import bootstrap from './streams/app';

bootstrap();
