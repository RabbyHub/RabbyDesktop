export function ensureSuffix(str = '', suffix = '/') {
  return str.endsWith(suffix) ? str : str + suffix;
}

export function randString(length: number = 10) {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0, rnum: number; i < length; ++i) {
      rnum = Math.floor(Math.random() * chars.length);
      result += chars.charAt(rnum);
  }
  return result;
};
