export const appIsProd = process.env.NODE_ENV === 'production';
export const appIsDev = !appIsProd;
export const appIsDebugPkg =
  `${process.env.DEBUG}` === 'true' && process.env.BUILD_ENV === 'PRO';
