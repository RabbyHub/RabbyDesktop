import { getBuiltinViewType } from '../isomorphic/url';
import { ipcRendererObj } from './base';

declare global {
  interface Window {
    _paq?: string[][];
  }
}

const builtInViewType = getBuiltinViewType(window.location);
export async function injectMatomo() {
  if (!builtInViewType) return;

  const { requesterIsRabbyx, userId } = await ipcRendererObj.invoke(
    'get-rabbyx-info'
  );

  console.debug('[injectMatomo] is rabbyx page:', requesterIsRabbyx);
  if (requesterIsRabbyx) return;

  console.debug(
    '[injectMatomo] window._paq: %s, is Array? %s',
    window._paq,
    Array.isArray(window._paq)
  );

  window._paq = window._paq || [];
  const _paq = window._paq;
  /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
  _paq.push(['trackPageView']);
  _paq.push(['enableLinkTracking']);

  const u = 'https://matomo.debank.com/';
  _paq.push(['setTrackerUrl', `${u}matomo.php`]);
  _paq.push(['setSiteId', '4']);
  if (userId) {
    _paq.push(['setVisitorId', userId]);
  }

  console.debug('[injectMatomo] _paq setup', _paq, _paq === window._paq);
}
