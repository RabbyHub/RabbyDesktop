import {
  NativeAppSizes,
  NativeLayouts,
  NativeLayoutsCollapsed,
} from '@/isomorphic/const-size-next';
import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import {
  BrowserView,
  BrowserViewConstructorOptions,
  WebContents,
  webContents,
} from 'electron';
import { desktopAppStore } from '../store/desktopApp';
import { redirectToAboutBlank } from './browser';

const ghostViewIds = new Set<WebContents['id']>();

export class BrowserViewManager {
  private idleViews: Record<number, BrowserView> = {};

  private busyViews: Record<number, BrowserView> = {};

  constructor(
    private viewOpts: BrowserViewConstructorOptions,
    private opts?: {
      destroyOnRecycle?: boolean;
    }
  ) {}

  allocateView(loadBlank = false) {
    let view = Object.values(this.idleViews)[0];

    if (!view || view.webContents.isDestroyed()) {
      view = new BrowserView({
        ...this.viewOpts,
      });
    }

    delete this.idleViews[view.webContents.id];
    this.busyViews[view.webContents.id] = view;
    if (loadBlank) {
      view.webContents.loadURL('about:blank');
    }

    return view;
  }

  recycleView(view: BrowserView) {
    delete this.busyViews[view.webContents.id];

    if (!view.webContents.isDestroyed()) {
      view.webContents.stop();

      redirectToAboutBlank(view.webContents);
      view.webContents.clearHistory();
      this.idleViews[view.webContents.id] = view;

      if (this.opts?.destroyOnRecycle) {
        this._destroyView(view);
      }
    }
  }

  private _destroyView(view: BrowserView) {
    if (view.webContents.isDestroyed()) return;

    // then try to destroy it
    try {
      const viewId = view.webContents.id;

      view.webContents.close();
      // make sure you detach it from BrowserWindow first
      (view.webContents as any).destroy();
      delete this.idleViews[viewId];
      delete this.busyViews[viewId];
      ghostViewIds.add(viewId);

      console.debug(
        `[BrowserViewManager::recycleView] try to destroy webContents '${viewId}'`
      );

      if (!IS_RUNTIME_PRODUCTION) {
        setTimeout(() => {
          const shouldBeDeleted = webContents
            .getAllWebContents()
            .find((wc) => wc.id === viewId);
          if (shouldBeDeleted) {
            console.debug(
              `[BrowserViewManager::recycleView] webContents '${viewId}' not deleted, isDestroyed: ${shouldBeDeleted.isDestroyed()}`
            );
          }
        }, 0);
      }
    } catch (err) {
      console.debug(
        '[BrowserViewManager::recycleView] failed to destroy webContents',
        err
      );
    }
  }
}

export function pickMainWindowLayouts() {
  const sidebarCollapsed = desktopAppStore.get('sidebarCollapsed');

  return sidebarCollapsed ? NativeLayoutsCollapsed : NativeLayouts;
}

export function getMainWindowTopOffset() {
  return process.platform === 'darwin'
    ? 0
    : NativeAppSizes.windowTitlebarHeight;
}

export function patchTabbedBrowserWebContents(
  wc: Electron.WebContents,
  options: {
    windowId?: Electron.BrowserWindow['id'];
  }
) {
  // polyfill for window.close
  wc.executeJavaScript(`
    ;(function () {
      if (window.close && window.close.__patched) return ;

      if (
        window.location.href !== 'about:blank'
        && window.location.protocol !== 'chrome-extension:'
      ) return ;


      var origWinClose = window.close.bind(window);
      window.close = function (...args) {
        window.rabbyDesktop.ipcRenderer.sendMessage('__internal_webui-window-close', ${options.windowId}, ${wc.id});
        origWinClose(...args);
      }
      window.close.__patched = true;
    })();

    ;(function () {
      if (window.prompt && window.prompt.__patched) return ;

      var prompt = window.__RDPrompt.bind(window);
      prompt.__patched = true;

      delete window.prompt;
      Object.defineProperty(window, 'prompt', {
        value: window.__RDPrompt,
        writeable: false,
        configurable: false,
      });
      delete window.__RDPrompt;
    })();
  `);
}

export async function parseSiteMetaByWebContents(
  wc: Electron.WebContents
): Promise<ISiteMetaData> {
  const outlineScript = `
    const title = document.title;
    const ogMeta = {};
    const twitterMeta = {};

    // 从 meta 标签中提取 open graph 属性
    const ogTags = document.querySelectorAll('meta[property^="og:"]');
    for (const tag of ogTags) {
      ogMeta[tag.getAttribute('property').replace('og:', '')] =
        tag.getAttribute('content');
    }

    // 从 meta 标签中提取 twitter 属性
    const twitterTags = document.querySelectorAll('meta[name^="twitter:"]');
    for (const tag of twitterTags) {
      twitterMeta[tag.getAttribute('name').replace('twitter:', '')] =
        tag.getAttribute('content');
    }
    const linkRelIcons = document.querySelectorAll('link[rel="icon"]');
    const shortcuts = document.querySelectorAll('link[rel="shortcut icon"]');
    const appleTouchIcons = document.querySelectorAll('link[rel="apple-touch-icon"]');

    ({
      linkRelIcons: Array.from([...shortcuts, ...linkRelIcons]).map(item => ({href: item.href, sizes: item.sizes.value})),
      appleTouchIcons: Array.from(appleTouchIcons).map(item => ({href: item.href, sizes: item.sizes.value})),
      ogMeta,
      twitterMeta,
      title,
    });
  `;
  const { linkRelIcons, appleTouchIcons, ogMeta, twitterMeta, title } =
    await wc.executeJavaScript(outlineScript);

  return {
    twitter_card: twitterMeta,
    og: ogMeta,
    linkRelIcons,
    favicons: [...linkRelIcons, ...appleTouchIcons],
    title,
  };
}
