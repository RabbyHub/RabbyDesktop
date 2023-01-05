export function safeParse<T = any>(input: any, defaultValue: T = null as any) {
  try {
    return JSON.parse(input);
  } catch (e) {
    return defaultValue;
  }
}

export function shortStringify(input: any) {
  return JSON.stringify(input, null, 2);
}

function sortObjectByKeys<T extends object>(obj: T) {
  if (Array.isArray(obj)) return obj;

  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = (obj as any)[key];
      return acc;
    }, {} as any);
}

export function simpleDiff(v1: any, v2: any) {
  v1 = typeof v1 === 'object' ? sortObjectByKeys(v1) : v1;
  v2 = typeof v2 === 'object' ? sortObjectByKeys(v2) : v2;
  return JSON.stringify(v1) === JSON.stringify(v2);
}
