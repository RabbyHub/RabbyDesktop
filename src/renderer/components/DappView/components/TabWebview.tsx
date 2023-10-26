import { useLayoutEffect, useRef } from 'react';
import { useIsAnimating } from '@/renderer/hooks/useSidebar';
import classNames from 'classnames';
import styles from '../index.module.less';

/**
 * @description stub element for dapp view, guide dapp to render in this element
 */
export default function TabWebview({ dappId }: { dappId?: string }) {
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

    return () => {
      obs.unobserve(divEl);
      window.rabbyDesktop.ipcRenderer.sendMessage(
        '__internal_rpc:mainwindow:report-activeDapp-rect',
        {
          dappViewState: 'unmounted',
        }
      );
    };
  }, []);

  const { isAnimating } = useIsAnimating();

  return (
    <div
      ref={divRef}
      className={classNames(
        styles.tabWebviewWrapper,
        dappId && styles.withDappOpen,
        // IS_RUNTIME_PRODUCTION && styles.debug,
        isAnimating && styles.isAnimating
      )}
    >
      <div id="app-webview-tags" />
    </div>
  );
}
