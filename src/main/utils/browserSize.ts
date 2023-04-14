import { NativeAppSizes } from '@/isomorphic/const-size-next';

export function getMainWindowTopOffset() {
  return process.platform === 'darwin'
    ? 0
    : NativeAppSizes.windowTitlebarHeight;
}
