export function roundRectValue(retRect: Partial<Electron.Rectangle>) {
  if (retRect.x !== undefined) retRect.x = Math.round(retRect.x);
  if (retRect.y !== undefined) retRect.y = Math.round(retRect.y);
  if (retRect.width !== undefined) retRect.width = Math.round(retRect.width);
  if (retRect.height !== undefined) retRect.height = Math.round(retRect.height);

  return retRect;
}
