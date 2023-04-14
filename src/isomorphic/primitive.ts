export function coerceNumber(input: any, fallback = 0) {
  const output = Number(input);

  if (Number.isNaN(output)) return fallback;

  return output;
}

export function coerceInteger(input: any, fallback = 0) {
  const output = parseInt(input, 10);

  if (Number.isNaN(output)) return fallback;

  return output;
}
