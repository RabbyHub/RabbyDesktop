import { DAPP_ZOOM_VALUES } from './constants';

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

export function formatZoomValue(zoomPercent: number) {
  zoomPercent = Math.max(zoomPercent, DAPP_ZOOM_VALUES.MIN_ZOOM_PERCENT);
  zoomPercent = Math.min(zoomPercent, DAPP_ZOOM_VALUES.MAX_ZOOM_PERCENT);
  const zoomFactor = parseFloat(((zoomPercent / 100) as any).toFixed(1));

  return {
    zoomPercent,
    zoomFactor,
    zoomPercentText: `${zoomPercent}%`,
  };
}
