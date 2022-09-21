export function safeParse<T extends any = any>(input: any, defaultValue: T = null as any) {
  try {
    return JSON.parse(input);
  } catch (e) {
    return defaultValue
  }
}

export function shortStringify(input: any) {
  return JSON.stringify(input, null, 2);
}
