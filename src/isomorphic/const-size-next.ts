const dappNavigationLineHeight = 48;

const dappViewOffest = 10;
const dappNavigationTopOffset = dappViewOffest;
const dappViewPaddingOffsetToSidebar = dappViewOffest;

export const NativeAppSizes = {
  windowTitlebarHeight: 32,

  mainWindowDappTopOffset: dappNavigationLineHeight + dappNavigationTopOffset,

  dappViewPaddingOffsetToSidebar,

  rabbyxNotificationWindowWidth: 400,

  trezorLikeConnectionWindowHeaderHeight: 52,
};

const sidebarWidth = 160;
export const NativeLayouts = {
  dappsViewLeftOffset: sidebarWidth + dappViewPaddingOffsetToSidebar,
  dappsViewRightOffset: dappViewOffest,
  dappsViewBottomOffset: dappViewOffest,
};

const sidebarWidthShort = 66;
export const NativeLayoutsCollapsed = {
  dappsViewLeftOffset: sidebarWidthShort + dappViewPaddingOffsetToSidebar,
  dappsViewRightOffset: dappViewOffest,
  dappsViewBottomOffset: dappViewOffest,
};

const shadowRightOffset = 6;
const shadowBottomOffset = 8;
export const InDappFindSizes = {
  // close to 6.8192
  shadowRightOffset,
  shadowBottomOffset,
  width: 356 + shadowRightOffset,
  height: 52 + shadowBottomOffset,
};
