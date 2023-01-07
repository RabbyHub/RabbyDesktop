import { useLatestDappScreenshot } from '@/renderer/hooks-shell/useMainWindow';
import classNames from 'classnames';
import { useLayoutEffect, useRef } from 'react';
import styles from './index.module.less';

/**
 * @description stub element for dapp view, guide dapp to render in this element
 */
function ActiveDappView() {
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

  const imageDataURL = useLatestDappScreenshot();

  return (
    <div
      ref={divRef}
      className={classNames(
        styles.activeDappView,
        imageDataURL && styles.withScreenshot
      )}
    >
      {/* disabled now */}
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

export function DappViewWrapper({
  children,
}: // eslint-disable-next-line @typescript-eslint/ban-types
React.PropsWithChildren<{}>) {
  return (
    <div className={styles.dappViewWrapper}>
      {children || null}
      <div className={styles.dappViewGasket}>
        <ActiveDappView />
      </div>
    </div>
  );
}
