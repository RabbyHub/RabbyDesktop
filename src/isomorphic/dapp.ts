export function isValidDappAlias(alias: string) {
  return /[\w\d]+/.test(alias);
}
