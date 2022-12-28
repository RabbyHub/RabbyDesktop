const TABS_LINE_HEIGHT_MACOS = 44;
const TABS_LINE_HEIGHT_WIN32 = 52;

const TABS_LINE_HEIGHT = TABS_LINE_HEIGHT_MACOS;
const NAVIGATION_HEIGHT = 44;
export const NATIVE_HEADER_H = TABS_LINE_HEIGHT;
export const NATIVE_HEADER_WITH_NAV_H = TABS_LINE_HEIGHT + NAVIGATION_HEIGHT;

const SECURITY_NOTIFICATION_PADDING_RIGHT = 30;

export const DAPP_SAFE_VIEW_SIZES = {
  alertHeaderHeight: 40,
};

export const SECURITY_NOTIFICATION_VIEW_SIZE = {
  width: 330 + SECURITY_NOTIFICATION_PADDING_RIGHT,
  // cardHeight: 116,
  paddingRight: SECURITY_NOTIFICATION_PADDING_RIGHT,
  offsetTop: 2,
  // paddingVOffset: 24,
};

const ADDRBAR_CHECKITEMS_COUNT = 2;
export const SECURITY_ADDRBAR_VIEW_SIZE = {
  headerHeight: 56,
  width: 330,
  // 56px per checkitems, 2 check items
  height: 56 + 56 * ADDRBAR_CHECKITEMS_COUNT,

  detailedHeight: 44 /* header */ + 236 /* main */,
};
