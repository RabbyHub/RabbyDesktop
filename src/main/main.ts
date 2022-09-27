/// <reference path="../renderer/preload.d.ts" />

import './store/dapps';
import './store/desktopApp';

import './controller/tab';

import './streams/tabbedBrowserWindow';
import './streams/rabbyExt';
import './streams/updater';
import './streams/session';

import bootstrap from './streams/app';

bootstrap();
