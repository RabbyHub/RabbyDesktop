import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLatestDappScreenshot } from '@/renderer/hooks-shell/useMainWindow';
import { useIsAnimating } from '@/renderer/hooks/useSidebar';
import classNames from 'classnames';
import {
  getWebviewTagsPark,
  queryTabWebviewTag,
  toggleShowElement,
} from '@/isomorphic/dom-helpers';
import { SAFE_WEBPREFERENCES } from '@/isomorphic/constants';
import { stringifyWebPreferences } from '@/isomorphic/string';
import styles from '../index.module.less';

/**
 * @description stub element for dapp view, guide dapp to render in this element
 */
export default function ActiveWebviewTag({ dappId }: { dappId?: string }) {
  const divRef = useRef<HTMLDivElement>(null);

  const obsRef = useRef<ResizeObserver>(
    new ResizeObserver(() => {
      const divEl = divRef.current!;
      const rect = divEl.getBoundingClientRect();

      window.rabbyDesktop.ipcRenderer.sendMessage(
        '__internal_rpc:mainwindow:report-activeDapp-rect',
        {
          dappViewState: 'mounted',
          rect: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          },
        }
      );
    })
  );

  useLayoutEffect(() => {
    const divEl = divRef.current;
    const obs = obsRef.current!;

    if (!divEl) return;

    obs.observe(divEl);

    const webviewTagObj = {
      value: null as Electron.WebviewTag | null,
    };

    const moveBackWebviewTag = () => {
      if (
        webviewTagObj.value &&
        !getWebviewTagsPark().contains(webviewTagObj.value)
      ) {
        getWebviewTagsPark().appendChild(webviewTagObj.value);
      }
    };

    window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:tabbed-window2:show-webview',
      (payload) => {
        const webviewTag = queryTabWebviewTag(
          payload
        ) as Electron.WebviewTag | null;

        webviewTagObj.value = webviewTag;

        if (!webviewTag) return;

        toggleShowElement(webviewTag, true);
        webviewTag.style.left = `${payload.viewBounds.x}px`;
        webviewTag.style.top = `${payload.viewBounds.y}px`;
        webviewTag.style.width = `${payload.viewBounds.width}px`;
        webviewTag.style.height = `${payload.viewBounds.height}px`;

        // if (!divEl.contains(webviewTag)) {
        //   // getWebviewTagsPark().removeChild(webviewTag);
        //   // divEl.appendChild(webviewTag);
        // }
      }
    );

    window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:tabbed-window2:hide-webview',
      (payload) => {
        const webviewTag = queryTabWebviewTag(payload);

        if (!webviewTag) return;

        moveBackWebviewTag();
      }
    );

    return () => {
      // return back
      moveBackWebviewTag();

      obs.unobserve(divEl);
      window.rabbyDesktop.ipcRenderer.sendMessage(
        '__internal_rpc:mainwindow:report-activeDapp-rect',
        {
          dappViewState: 'unmounted',
        }
      );
    };
  }, []);

  const imageDataURL = useLatestDappScreenshot();
  const { isAnimating } = useIsAnimating();

  return (
    <div
      ref={divRef}
      className={classNames(
        styles.activeDappView,
        // IS_RUNTIME_PRODUCTION && styles.debug,
        imageDataURL && styles.withScreenshot,
        isAnimating && styles.isAnimating
      )}
    >
      {imageDataURL && (
        <div
          className={styles.activeDappScreenshot}
          style={{
            backgroundImage: `url(${imageDataURL})`,
          }}
        />
      )}
    </div>
  );
}
