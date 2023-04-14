/// <reference path="../renderer/preload.d.ts" />

import './store';

import './streams/tabbedBrowserWindow';
import './streams/mainWindow';
import './streams/rabbyExt';
import './streams/updater';
import './streams/session';
import './streams/dappSafeview';
import './streams/dappLoadingView';
import './streams/securityCheck';
import './streams/securityAddressbarPopup';
// import './streams/clipboard';
import './streams/alertWindows';
import './streams/browser';
import './streams/popupOnMainwin';
import './streams/popupViewOnMainwin';
import './streams/webContents';
import './streams/appProxy';
import './streams/hid';
import './streams/dapps';
import './streams/ipfs';
import './streams/trezorLike';

import './streams/bundle';
import './streams/cex/binance';

import './streams/developer';

import bootstrap from './streams/app';

bootstrap();
