import { checkHardwareConnectPage, isRabbyXPage } from '@/isomorphic/url';
import { isProtocolLeaveInApp } from '@/isomorphic/dapp';
import { Tabs } from '../browser/tabs';

export function checkOpenAction(
  tabs: Tabs,
  opts: {
    fromUrl: string;
    toUrl: string;
    fromSameWindow: boolean;
    rabbyExtId: string;
    blockchainExplorers: Set<
      (IAppDynamicConfig['blockchain_explorers'] & object)[number]
    >;
  }
):
  | {
      action: 'activate-tab' | 'open-in-new-tab' | 'custom' | 'deny';
      tabId: number;
      openedTab?: Tabs['tabList'][number] | null;
    }
  | {
      action: 'open-external';
      externalUrl: string;
    }
  | {
      action: 'open-hardware-connect';
      type: IHardwareConnectPageType;
      pageURL: string;
    } {
  if (!isProtocolLeaveInApp(opts.toUrl)) {
    return {
      action: 'open-external',
      externalUrl: opts.toUrl,
    };
  }

  const isFromExt = opts.fromUrl.startsWith('chrome-extension://');
  const isToExt = opts.toUrl.startsWith('chrome-extension://');

  const isFromRabbyxBg = isRabbyXPage(
    opts.fromUrl,
    opts.rabbyExtId,
    'background'
  );
  const hardwareConnectInfo = checkHardwareConnectPage(opts.toUrl);

  // maybe click behavior on notitication window
  if (isFromRabbyxBg && hardwareConnectInfo) {
    return {
      action: 'open-hardware-connect',
      type: hardwareConnectInfo.type,
      pageURL: opts.toUrl,
    };
  }

  const openedTab = !isToExt
    ? tabs.findByOrigin(opts.toUrl)
    : tabs.findByUrlbase(opts.toUrl);
  if (openedTab) {
    return {
      action: 'activate-tab',
      tabId: openedTab.id,
      openedTab,
    };
  }

  if (
    isRabbyXPage(opts.fromUrl, opts.rabbyExtId) &&
    (opts.toUrl.startsWith('http') || !opts.toUrl)
  ) {
    // http(s) url
    return {
      action: 'open-external',
      externalUrl: opts.toUrl || 'https://rabby.io',
    };
  }

  if (opts.fromSameWindow) {
    if (isFromExt) {
      return {
        action: 'open-in-new-tab',
        tabId: -1,
      };
    }

    return {
      action: 'custom',
      tabId: -1,
    };
  }

  return {
    action: 'deny',
    tabId: -1,
  };
}
