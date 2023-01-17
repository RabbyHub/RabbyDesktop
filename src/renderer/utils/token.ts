export const ellipsisTokenSymbol = (text: string, length = 5) => {
  const regexp = new RegExp(`^(.{${length}})(.*)$`);
  return text.replace(regexp, '$1...');
};
