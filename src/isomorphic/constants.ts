export const IS_RUNTIME_PRODUCTION = process.env.NODE_ENV === 'production';
export const APP_NAME = !IS_RUNTIME_PRODUCTION
  ? 'rabby-desktop-dev'
  : 'rabby-desktop';

export const APP_UA_NAME = 'RabbyDesktop';

export const APP_BRANDNAME = 'Rabby Desktop';

// drive electron-store, dont use strange characters here becaus it will be used as part of file name
export const PERSIS_STORE_PREFIX = 'rabby-store-';

export const RABBY_INTERNAL_PROTOCOL = 'rabby-internal:';
export const PROTOCOL_IPFS = 'rabby-ipfs:';
export const PROTOCOL_ENS = 'rabby-ens:';
export const PROTOCOL_LOCALFS = 'rabby-fs:';

export const LOCALIPFS_BRAND = `local.ipfs`;
export const LOCALFS_BRAND = `local.fs`;
export const ENS_LOCALHOST_DOMAIN = `eth.localens`;

export const DAPP_TYPE_TO_OPEN_AS_HTTP = [
  'ipfs',
  'ens',
  'localfs',
] as IValidDappType[];

export const PROTOCOLS_SUPPORTED_TO_OPEN = [
  'http://' as const,
  'https://' as const,

  'ipfs://' as const,
  'rabby-ipfs://' as const,

  'ens://' as const,
  'rabby-ens://' as const,

  'localfs://' as const,
  'rabby-fs://' as const,
  // 'file://' as const,

  'chrome-extension://' as const,
];

// only useful in dev mode
let DEV_SERVER_PORT = 1212;
try {
  const port = parseInt(process.env.PORT as any, 10);
  if (port && !Number.isNaN(port)) DEV_SERVER_PORT = port;
  // eslint-disable-next-line no-empty
} catch (e) {}
export const RABBY_LOCAL_URLBASE =
  IS_RUNTIME_PRODUCTION || !process.env.HTTP_INSTEAD_OF_CUSTOM
    ? `${RABBY_INTERNAL_PROTOCOL}//local`
    : `http://localhost:${DEV_SERVER_PORT}`;

export const RABBY_GETTING_STARTED_URL = `${RABBY_LOCAL_URLBASE}/getting-started.html`;
export const RABBY_SPALSH_URL = `${RABBY_LOCAL_URLBASE}/splash.html`;
export const RABBY_LOADING_URL = `${RABBY_LOCAL_URLBASE}/loading.html`;

export const RABBY_MAIN_POPUP_VIEW = `${RABBY_LOCAL_URLBASE}/main-popup-view.html`;
export const RABBY_POPUP_GHOST_VIEW_URL = `${RABBY_LOCAL_URLBASE}/popup-view.html`;

export const RABBY_BLANKPAGE_RELATIVE_URL = `preloads/blank.html`;

export const GAS_LEVEL_TEXT = {
  slow: 'Standard',
  normal: 'Fast',
  fast: 'Instant',
  custom: 'Custom',
};

export const SAFE_WEBPREFERENCES: Electron.WebPreferences = {
  sandbox: true,
  nodeIntegration: false,
  nodeIntegrationInWorker: false,
  allowRunningInsecureContent: false,
  autoplayPolicy: 'user-gesture-required',
  contextIsolation: true,
};

export const FORCE_DISABLE_CONTENT_PROTECTION = true;

export const APP_RUNTIME_ENV = IS_RUNTIME_PRODUCTION
  ? 'production'
  : 'development';

export const SENTRY_DEBUG = !IS_RUNTIME_PRODUCTION;
// export const SENTRY_DEBUG = false;

export const enum EnumOpenDappAction {
  'deny' = 'deny',
  'openExternal' = 'openExternal',
  'safeOpenOrSwitchToAnotherTab' = 'safeOpenOrSwitchToAnotherTab',
  // 'openInNewtab' = 'openInNewtab',
  // 'alertUserAddDapp' = 'alertUserAddDapp',
  'leaveInTab' = 'leaveInTab',
}

export const enum EnumMatchDappType {
  byOrigin = 1,
  bySecondaryDomain,
}

export const TOAST_TOP = 70;

export const DAPP_ZOOM_VALUES = {
  DEFAULT_ZOOM_PERCENT: 90,
  MAX_ZOOM_PERCENT: 100,
  MIN_ZOOM_PERCENT: 60,
};

// const macVersionMap = new Map([
//   [21, ['Monterey', '12']],
//   [20, ['Big Sur', '11']],
//   [19, ['Catalina', '10.15']],
//   [18, ['Mojave', '10.14']],
//   [17, ['High Sierra', '10.13']],
//   [16, ['Sierra', '10.12']],
//   [15, ['El Capitan', '10.11']],
//   [14, ['Yosemite', '10.10']],
//   [13, ['Mavericks', '10.9']],
//   [12, ['Mountain Lion', '10.8']],
//   [11, ['Lion', '10.7']],
//   [10, ['Snow Leopard', '10.6']],
//   [9, ['Leopard', '10.5']],
//   [8, ['Tiger', '10.4']],
//   [7, ['Panther', '10.3']],
//   [6, ['Jaguar', '10.2']],
//   [5, ['Puma', '10.1']],
// ]);

export const SYSTEM_REQUIREMENT_MINIMUM = IS_RUNTIME_PRODUCTION
  ? {
      win32: 10,
      darwin: 20, // 20 means Big Sur
    }
  : {
      win32: 99,
      darwin: 99,
    };

export const IS_DEVTOOLS_AVAILBLE =
  !IS_RUNTIME_PRODUCTION || process.env.BUILD_USE_DEVTOOLS === 'true';
