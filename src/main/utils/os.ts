import { SYSTEM_REQUIREMENT_MINIMUM } from '@/isomorphic/constants';
import os = require('os');

export function getSystemReleaseInfo(): ISystemReleaseInfo {
  const sysVersion = os.release();
  if (process.platform === 'win32') {
    const majorVersion = parseInt(sysVersion.split('.')[0], 10);

    return {
      sysVersion,
      majorVersion,
      isDeprecated: majorVersion < SYSTEM_REQUIREMENT_MINIMUM.win32,
    };
  }

  const majorVersion = parseInt(sysVersion.split('.')[0], 10);

  return {
    sysVersion,
    majorVersion,
    isDeprecated: majorVersion < SYSTEM_REQUIREMENT_MINIMUM.darwin,
  };
}
