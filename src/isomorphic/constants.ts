export const IS_RUNTIME_PRODUCTION = process.env.NODE_ENV === 'production';
export const APP_NAME = !IS_RUNTIME_PRODUCTION
  ? 'rabby-desktop-dev'
  : 'rabby-desktop';

export const APP_UA_NAME = 'RabbyDesktop';

// drive electron-store, dont use strange characters here becaus it will be used as part of file name
export const PERSIS_STORE_PREFIX = 'rabby-store-';

export const RABBY_INTERNAL_PROTOCOL = 'rabby-internal:';
export const PROTOCOL_IPFS = 'ipfs:';

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
