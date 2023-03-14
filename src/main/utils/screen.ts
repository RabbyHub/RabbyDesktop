import { screen } from 'electron';

import { FRAME_DEFAULT_SIZE, FRAME_MIN_SIZE } from '@/isomorphic/const-size';
import { roundRectValue } from '@/isomorphic/shape';
import { desktopAppStore } from '../store/desktopApp';

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

  // determine final width
  if (workArea.width < FRAME_MIN_SIZE.minWidth) {
    expectedBounds.width = Math.min(expectedBounds.width, workArea.width);
  } else {
    expectedBounds.width = Math.max(
      expectedBounds.width,
      FRAME_MIN_SIZE.minWidth
    );
  }

  // determine final width
  if (workArea.height < FRAME_MIN_SIZE.minHeight) {
    expectedBounds.height = Math.min(expectedBounds.height, workArea.height);
  } else {
    expectedBounds.height = Math.max(
      expectedBounds.height,
      FRAME_MIN_SIZE.minHeight
    );
  }

  // fix x
  if (expectedBounds.x + expectedBounds.width > workArea.x + workArea.width) {
    expectedBounds.x = workArea.x + workArea.width - expectedBounds.width;
  }
  // fix y
  if (expectedBounds.y + expectedBounds.height > workArea.y + workArea.height) {
    expectedBounds.y = workArea.y + workArea.height - expectedBounds.height;
  }

  roundRectValue(expectedBounds);

  return expectedBounds;
}

export function getMainWinLastPosition() {
  const pos = desktopAppStore.get('lastWindowPosition');

  const expectedBounds = getWindowBoundsInWorkArea({
    x: pos.x || 0,
    y: pos.y || 0,
    width: pos.width || FRAME_DEFAULT_SIZE.width,
    height: pos.height || FRAME_DEFAULT_SIZE.height,
  });

  return expectedBounds;
}

export function setMainWindowBounds(
  mainWindow: Electron.BrowserWindow,
  bounds: Electron.Rectangle
) {
  const minSize = mainWindow.getMinimumSize();

  roundRectValue(bounds);
  if (bounds.width !== minSize[0] || bounds.height !== minSize[1]) {
    minSize[0] = Math.min(minSize[0], bounds.width);
    minSize[1] = Math.min(minSize[1], bounds.height);
    mainWindow.setMinimumSize(minSize[0], minSize[1]);
  }

  mainWindow.setBounds(bounds);
}
