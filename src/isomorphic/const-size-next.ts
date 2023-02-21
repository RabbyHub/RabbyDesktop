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
