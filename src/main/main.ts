/// <reference path="../renderer/preload.d.ts" />

import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { hookNodeModulesAsar } from 'asarmor/src/encryption/hooks';

// put thie stream before all other imports
import './streams/pre-bootstrap';

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

import bootstrapApp from './streams/app';

if (IS_RUNTIME_PRODUCTION) {
  hookNodeModulesAsar();
}

export function bootstrap(k: Uint8Array) {
  // sanity check
  if (!Array.isArray(k) || k.length === 0) {
    throw new Error('Failed to bootstrap application.');
  }

  bootstrapApp();
}

if (!IS_RUNTIME_PRODUCTION) {
  bootstrapApp();
}
