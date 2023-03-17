export function ensurePrefix(str = '', prefix = '/') {
  return str.startsWith(prefix) ? str : prefix + str;
}

export function ensureSuffix(str = '', suffix = '/') {
  return str.endsWith(suffix) ? str : str + suffix;
}

export function unPrefix(str = '', prefix = '/') {
  return str.startsWith(prefix) ? str.slice(prefix.length) : str;
}

export function randString(length = 10) {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0, rnum: number; i < length; ++i) {
    rnum = Math.floor(Math.random() * chars.length);
    result += chars.charAt(rnum);
  }
  return result;
}

export function keywordMatch(keyword: string, text?: string | number) {
  return `${text ?? ''}`.toLowerCase().includes(keyword);
}

export function extractProductNameFromHIDPath(hidPath: string) {
  const pathParts = hidPath.match(/\{([^{^}]+)\}/) || [];
  return pathParts[1] || '';
}

export function stringifyWebPreferences(preferences: Electron.WebPreferences) {
  return Object.entries(preferences)
    .reduce((accu, [key, value]) => {
      if (typeof value === 'boolean') {
        accu.push(`${key}=${value ? 1 : 0}`);
      } else {
        accu.push(`${key}=${value}`);
      }

      return accu;
    }, [] as `${string}=${string}`[])
    .join(', ');
}

export function isInvalidBase64(base64?: string) {
  if (!base64) return true;

  return !base64.split(';base64,')?.[1];
}
