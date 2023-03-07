import { filterAppChannel, getSentryEnv } from '@/isomorphic/env';
import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';

Sentry.init({
  dsn: 'https://520afbe8f6574cb3a39e6cb7296f9008@o460488.ingest.sentry.io/4504751161868288',
  integrations: [new Integrations.BrowserTracing()],
  release: window.rabbyDesktop.appVersion,

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
  environment: getSentryEnv(filterAppChannel(process.env.BUILD_CHANNEL)),
  ignoreErrors: [],
});
