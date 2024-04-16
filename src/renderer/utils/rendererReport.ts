import { filterAppChannel, getSentryEnv } from '@/isomorphic/env';
import { Integrations } from '@sentry/tracing';

// import { init as reactInit } from '@sentry/react';
import * as Sentry from '@sentry/react';
// import * as Sentry from "@sentry/electron/renderer";

import { SENTRY_DEBUG } from '@/isomorphic/constants';

// more details on https://docs.sentry.io/platforms/javascript/guides/electron/
Sentry.init({
  dsn: 'https://5d305a88558d9d594e2b28b0e8410c47@o4507018303438848.ingest.us.sentry.io/4507018397941760',
  integrations: [new Integrations.BrowserTracing()],
  release: window.rabbyDesktop.appVersion,
  debug: SENTRY_DEBUG,

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
  environment: getSentryEnv(filterAppChannel(process.env.BUILD_CHANNEL)),
  ignoreErrors: [],
});
