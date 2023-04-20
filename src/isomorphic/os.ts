type IOSPlatform = 'win32' | 'darwin' | 'unix' | 'linux' | 'unknown';

const IS_CLIENT = typeof window !== 'undefined';

export function detectClientOS(
  userAgent: typeof Navigator.prototype.userAgent = typeof window ===
  'undefined'
    ? ''
    : window.navigator.userAgent
): IOSPlatform {
  if (userAgent.indexOf('Win') !== -1) return 'win32' as const;
  if (userAgent.indexOf('Mac') !== -1) return 'darwin' as const;
  if (userAgent.indexOf('X11') !== -1) return 'unix' as const;
  if (userAgent.indexOf('Linux') !== -1) return 'linux' as const;

  return 'unknown' as const;
}

export function detectMainOS(): IOSPlatform {
  switch (process.platform) {
    case 'win32':
      return 'win32';
    case 'darwin':
      return 'darwin';
    case 'linux':
      return 'linux';
    default:
      return 'unknown';
  }
}

export function getOSPlatform() {
  return IS_CLIENT ? detectClientOS() : detectMainOS();
}
