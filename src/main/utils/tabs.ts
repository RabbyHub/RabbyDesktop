import { Tabs } from "../browser/tabs";

export function checkOpenAction (tabs: Tabs, opts: {
  fromUrl: string,
  toUrl: string,
  fromSameWindow: boolean,
}): {
  action: 'activate-tab' | 'open-in-new-tab' | "custom" | 'deny'
  tabId: number
  openedTab?: Tabs['tabList'][number] | null
} { 
  const isFromExt = opts.fromUrl.startsWith('chrome-extension://');
  const isToExt = opts.toUrl.startsWith('chrome-extension://');

  const openedTab = !isToExt ? tabs.findByOrigin(opts.toUrl) : tabs.findByUrlbase(opts.toUrl);
  if (openedTab) {
    return {
      action: 'activate-tab',
      tabId: openedTab.id,
      openedTab,
    }
  }

  if (opts.fromSameWindow) {
    if (isFromExt) {
      return {
        action: 'open-in-new-tab',
        tabId: -1
      }
    }

    return {
      action: 'custom',
      tabId: -1
    }
  }

  return {
    action: 'deny',
    tabId: -1
  }
}