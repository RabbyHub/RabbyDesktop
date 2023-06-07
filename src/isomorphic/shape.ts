export function roundRectValue(retRect: Partial<Electron.Rectangle>) {
  if (retRect.x !== undefined) retRect.x = Math.round(retRect.x);
  if (retRect.y !== undefined) retRect.y = Math.round(retRect.y);
  if (retRect.width !== undefined) retRect.width = Math.round(retRect.width);
  if (retRect.height !== undefined) retRect.height = Math.round(retRect.height);

  return retRect;
}

export function roundDOMRect(domRect: DOMRect) {
  const rectValues = (
    typeof domRect.toJSON === 'function' ? domRect.toJSON() : domRect
  ) as Omit<DOMRect, 'toJSON'>;
  if (rectValues.x !== undefined) rectValues.x = Math.round(rectValues.x);
  if (rectValues.y !== undefined) rectValues.y = Math.round(rectValues.y);
  if (rectValues.width !== undefined)
    rectValues.width = Math.round(rectValues.width);
  if (rectValues.height !== undefined)
    rectValues.height = Math.round(rectValues.height);

  return rectValues;
}
