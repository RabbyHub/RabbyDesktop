import { APP_RUNTIME_ENV } from './constants';

export function getSentryEnv(appChannel: 'reg' | 'prod') {
  return `channel:${appChannel}-env:${APP_RUNTIME_ENV}`;
}
