import { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { SAFE_WEBPREFERENCES } from '@/isomorphic/constants';
import { stringifyWebPreferences } from '@/isomorphic/string';
import styled from 'styled-components';

const webviewWebPreferencesAttr = stringifyWebPreferences({
  ...SAFE_WEBPREFERENCES,
  disableDialogs: false,
});

const Container = styled.div`
  &.preview-webview-load-failed > webview,
  &.preview-webview-loading > webview {
    display: none;
  }
`;

export function PreviewWebview({
  containerClassName,
  loadFailedView,
  loadingView,
  ...props
}: Omit<
  React.DetailedHTMLProps<
    React.WebViewHTMLAttributes<HTMLWebViewElement>,
    HTMLWebViewElement
  >,
  'partition' | 'webpreferences'
> & {
  loadFailedView?: React.ReactNode;
  loadingView?: React.ReactNode;
  containerClassName?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // leave here for future use
  // useLayoutEffect(() => {
  //   if (!containerRef.current) return;
  //   const webview = containerRef.current.querySelector('webview');
  //   if (!webview) return;
  //   const containerRect = containerRef.current.getBoundingClientRect();
  //   const previewRealW = containerRect.width;
  //   const previewRealH = containerRect.height;
  //   const embeddedH = 768;
  //   const scale = (previewRealH / embeddedH);
  //   const ratio = (previewRealW / previewRealH);
  //   // width: unit(@ratio * @embeddedH, px);
  //   (webview as HTMLElement).style.width = `${ratio * embeddedH}px`;
  //   (webview as HTMLElement).style.height = `${embeddedH}px`;
  //   (webview as HTMLElement).style.transform = `scale(${scale})`;
  // }, []);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadFailed, setIsLoadFailed] = useState(false);
  const [url, setUrl] = useState('');
  // did-fail-load
  useEffect(() => {
    if (!containerRef.current) return;
    const webview = containerRef.current.querySelector('webview');

    if (!webview) return;

    const handleDidFailLoad = (event: Electron.Event) => {
      setIsLoading(false);
      setIsLoadFailed(true);
    };

    const loadstart = () => {
      setIsLoading(true);
    };

    const loadstop = () => {
      setIsLoading(false);
      setUrl((webview as any).getURL());
    };

    webview.addEventListener('did-start-loading', loadstart);
    webview.addEventListener('did-stop-loading', loadstop);
    webview.addEventListener('did-fail-load', handleDidFailLoad);
    return () => {
      webview.removeEventListener('did-start-loading', loadstart);
      webview.removeEventListener('did-stop-loading', loadstop);
      webview.removeEventListener('did-fail-load', handleDidFailLoad);
    };
  }, []);

  if (!props.src) return null;

  return (
    <Container
      className={classNames(
        containerClassName,
        isLoadFailed && 'preview-webview-load-failed',
        isLoading && 'preview-webview-loading'
      )}
      ref={containerRef}
    >
      <webview
        {...props}
        // leave here for debug load-failed view
        // src={'https://localhost:4000/'}
        partition="checkingView"
        webpreferences={webviewWebPreferencesAttr}
      />
      {isLoading ? loadingView : null}
      {!isLoading && isLoadFailed ? loadFailedView || null : null}
      {!isLoading && !isLoadFailed && url ? (
        <div className="preview-webview-url">{url}</div>
      ) : null}
    </Container>
  );
}
