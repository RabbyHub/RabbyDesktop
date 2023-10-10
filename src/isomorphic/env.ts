import { APP_RUNTIME_ENV } from './constants';

export function getSentryEnv(appChannel: 'reg' | 'prod') {
  return `channel:${appChannel}-env:${APP_RUNTIME_ENV}`;
}

export function filterAppChannel(input?: string): 'reg' | 'prod' {
  switch (input) {
    case 'reg':
      return 'reg';
    default:
    case 'prod':
      return 'prod';
  }
}

export function getRendererAppChannel() {
  return filterAppChannel(process.env.BUILD_CHANNEL);
}
