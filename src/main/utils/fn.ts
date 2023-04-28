import * as Sentry from '@sentry/electron/main';

export function safeRunInMainProcess<T extends (...argList: any[]) => any>(
  fn: T,
  ...args: Parameters<T>
): ReturnType<T> | undefined {
  try {
    return fn(...args);
  } catch (err) {
    Sentry.captureException(err);
  }
}
