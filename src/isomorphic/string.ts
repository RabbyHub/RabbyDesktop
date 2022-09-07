export function ensureSuffix (str = '', suffix = '/') {
  return str.endsWith(suffix) ? str : str + suffix
}
