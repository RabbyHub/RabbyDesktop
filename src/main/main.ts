/// <reference path="../renderer/preload.d.ts" />

// put thie stream before all other imports
import './streams/pre-bootstrap';

import './store';

import './streams/webviewTagBasedWindow';
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
import './streams/usb';
import './streams/hid';
import './streams/hardwardMedia';
import './streams/dapps';
import './streams/ipfs';
import './streams/trezorLike';

import './streams/bundle';
import './streams/cex/binance';
import './streams/cex/okx';

import './streams/developer';

import bootstrap from './streams/app';

bootstrap();
