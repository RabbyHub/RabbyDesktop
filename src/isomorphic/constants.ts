export const IS_RUNTIME_PRODUCTION = process.env.NODE_ENV === 'production';
export const APP_NAME = !IS_RUNTIME_PRODUCTION ? 'rabby-desktop-dev' : 'rabby-desktop';

export const APP_UA_NAME = 'RabbyDesktop';

// drive electron-store, dont use strange characters here becaus it will be used as part of file name
export const PERSIS_STORE_PREFIX = 'rabby-store-';

export const RABBY_INTERNAL_PROTOCOL = 'rabby-internal:';
export const RABBY_HOMEPAGE_URL = `${RABBY_INTERNAL_PROTOCOL}//local/index.html`;
