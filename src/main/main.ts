/// <reference path="../renderer/preload.d.ts" />

import './store/dapps';
import './store/desktopApp';

import './streams/tabbedBrowserWindow';
import './streams/mainWindow';
import './streams/rabbyExt';
import './streams/updater';
import './streams/session';
import './streams/dappSafeview';
import './streams/dappLoadingView';
import './streams/securityCheck';
import './streams/securityAddressbarPopup';
import './streams/securityNotification';
import './streams/clipboard';
import './streams/browser';
import './streams/popupOnMainwin';
import './streams/popupViewOnMainwin';
import './streams/webContents';
import './streams/appProxy';

import bootstrap from './streams/app';

bootstrap();
