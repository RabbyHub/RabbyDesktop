import { NativeAppSizes } from '@/isomorphic/const-size-next';

const isWin32 = process.platform === 'win32';
export function getMainWindowTopOffset() {
  return isWin32 ? NativeAppSizes.windowTitlebarHeight : 0;
}
