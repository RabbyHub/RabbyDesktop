import * as Sentry from '@sentry/electron';
import { app } from 'electron';

import { getSentryEnv } from '@/isomorphic/env';
import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';

import { getMainProcessAppChannel } from './app';

Sentry.init({
  dsn: 'https://520afbe8f6574cb3a39e6cb7296f9008@o460488.ingest.sentry.io/4504751161868288',
  release: app.getVersion(),

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
  environment: getSentryEnv(getMainProcessAppChannel()),
  debug: !IS_RUNTIME_PRODUCTION,
});
