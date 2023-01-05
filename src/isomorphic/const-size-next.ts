const dappNavigationLineHeight = 48;
const dappNavigationTopOffset = 16;

const dappViewPaddingOffsetToSidebar = 22;

export const NativeAppSizes = {
  windowTitlebarHeight: 32,

  mainWindowDappTopOffset: dappNavigationLineHeight + dappNavigationTopOffset,

  dappViewPaddingOffsetToSidebar,

  rabbyxNotificationWindowWidth: 400,
};

const sidebarWidth = 160;
export const NativeLayouts = {
  dappsViewLeftOffset: sidebarWidth + dappViewPaddingOffsetToSidebar,
};

const sidebarWidthShort = 66;
export const NativeLayoutsCollapsed = {
  dappsViewLeftOffset: sidebarWidthShort + dappViewPaddingOffsetToSidebar,
};
