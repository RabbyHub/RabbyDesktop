import { APP_RUNTIME_ENV } from './constants';

export function getSentryEnv(appChannel: 'reg' | 'prod') {
  return `channel:${appChannel}-env:${APP_RUNTIME_ENV}`;
}

export function filterAppChannel(input?: string): 'reg' | 'prod' {
  switch (input) {
    default:
    case 'reg':
      return 'reg';
    case 'prod':
      return 'prod';
  }
}
