export function arraify<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

export function firstEl<T>(input: T | T[]): T {
  return arraify(input)[0];
}
