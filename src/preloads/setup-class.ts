import { getRabbyXWindowPosition } from '../isomorphic/rabbyx';
import { parseQueryString } from '../isomorphic/url';

export function setupClass() {
  const osType = process.platform;
  document.addEventListener('DOMContentLoaded', () => {
    const osCls = `os-${osType}`;
    document.body.classList.add(osCls);

    document.documentElement.classList.add(osCls, '__rabbyx-shell-page');

    if (
      window.location.protocol === 'chrome-extension:' &&
      window.location.pathname === '/notification.html' &&
      getRabbyXWindowPosition(parseQueryString(window.location.search).type) ===
        'center'
    ) {
      document.documentElement.classList.add(
        osCls,
        '__rabbyx-center-sign-window'
      );
    }
  });
}
