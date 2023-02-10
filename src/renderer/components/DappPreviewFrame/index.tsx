import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { useLatestDappScreenshot } from '@/renderer/hooks-shell/useMainWindow';
import classNames from 'classnames';
import { useEffect, useLayoutEffect, useRef } from 'react';
import styles from './index.module.less';

function makeObs(dappURL: string, getDiv: () => HTMLDivElement) {
  return new ResizeObserver((/* entries: ResizeObserverEntry[] */) => {
    const divEl = getDiv();

    const rect = divEl.getBoundingClientRect();

    window.rabbyDesktop.ipcRenderer.sendMessage(
      '__internal_rpc:preview-dapp-frame:toggle-show',
      {
        dappViewState: 'mounted',
        dappURL,
        rect: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        },
      }
    );
  });
}

/**
 * @description stub element for dapp view, guide dapp to render in this element
 */
function DappPreviewView({ dappURL }: { dappURL: string }) {
  const divRef = useRef<HTMLDivElement>(null);

  const obsRef = useRef<ResizeObserver>(
    makeObs(dappURL, () => divRef.current!)
  );

  useEffect(() => {
    obsRef.current = makeObs(dappURL, () => divRef.current!);
  }, [dappURL]);

  useLayoutEffect(() => {
    const divEl = divRef.current;
    const obs = obsRef.current!;

    if (!divEl) return;

    obs.observe(divEl);

    return () => {
      obs.unobserve(divEl);
      window.rabbyDesktop.ipcRenderer.sendMessage(
        '__internal_rpc:preview-dapp-frame:toggle-show',
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
        IS_RUNTIME_PRODUCTION && styles.debug,
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

export function DappPreviewFrame({
  className,
  children,
  dappURL,
}: React.PropsWithChildren<{
  className?: string;
  dappURL: string;
}>) {
  if (!dappURL) return null;

  return (
    <div className={classNames(styles.dappViewWrapper, className)}>
      {children || null}
      <div className={styles.dappViewGasket}>
        <DappPreviewView dappURL={dappURL} />
      </div>
    </div>
  );
}
