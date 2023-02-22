import { screen } from 'electron';

import { FRAME_MIN_SIZE } from '@/isomorphic/const-size';
import { roundRectValue } from '@/isomorphic/shape';

export function getWindowBoundsInWorkArea(
  inputBounds: Partial<Electron.Rectangle>
) {
  const expectedBounds = {
    x: inputBounds?.x || 0,
    y: inputBounds?.y || 0,
    width: inputBounds?.width || FRAME_MIN_SIZE.minWidth,
    height: inputBounds?.height || FRAME_MIN_SIZE.minHeight,
  };

  const display = screen.getDisplayMatching(expectedBounds);
  const { workArea } = display;
  expectedBounds.width = Math.min(expectedBounds.width, workArea.width);
  expectedBounds.height = Math.min(expectedBounds.height, workArea.height);

  if (expectedBounds.x + expectedBounds.width > workArea.x + workArea.width) {
    expectedBounds.x = workArea.x + workArea.width - expectedBounds.width;
  }
  if (expectedBounds.y + expectedBounds.height > workArea.y + workArea.height) {
    expectedBounds.y = workArea.y + workArea.height - expectedBounds.height;
  }

  roundRectValue(expectedBounds);

  return expectedBounds;
}
