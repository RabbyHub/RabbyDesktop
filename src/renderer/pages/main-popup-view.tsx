/// <reference path="../preload.d.ts" />

import { createRoot } from 'react-dom/client';
import '../css/style.less';

import './main-popup-view.less';
import { Modal } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  canoicalizeDappUrl,
  integrateQueryToUrl,
  parseQueryString,
} from 'isomorphic/url';
import useDragHeadbar from '../hooks/useDragheadbar';

const INIT_URL = decodeURIComponent(parseQueryString().__init_url__ || '');

function formatUrl(url: string) {
  return integrateQueryToUrl(url, {
    _rbd_insecurity_alert: 'true',
  });
}

export default function AlertInsecurity() {
  const [urlInfo, setUrlInfo] = useState({
    url: formatUrl(INIT_URL),
    isExisted: false,
  });

  const { origin } = useMemo(() => {
    return canoicalizeDappUrl(urlInfo.url);
  }, [urlInfo.url]);

  const webviewRef = useRef<
    HTMLWebViewElement & import('electron').BrowserWindow
  >(null);
  useEffect(() => {
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_rpc:dapp-tabs:open-safe-view',
      ({ url, isExisted }) => {
        setUrlInfo({ url, isExisted });
      }
    );
  }, []);

  useDragHeadbar();

  if (!urlInfo.url) return null;

  return (
    <Modal
      className="modal-alert-insecurity"
      wrapClassName="modal-alert-insecurity-wrap"
      open={!!urlInfo.url}
      maskClosable={false}
      mask
      onCancel={() => {
        window.rabbyDesktop.ipcRenderer.sendMessage(
          '__internal_rpc:dapp-tabs:close-safe-view'
        );
      }}
      closeIcon={
        <img
          className="close-icon"
          src="rabby-internal://assets/icons/alert-insecurity/icon-close.svg"
        />
      }
      footer={null}
    >
      <div className="alert-header">
        {urlInfo.isExisted ? (
          <div className="inner">
            This page is in reader mode because it doesn't belong to the current
            Dapp. You can have full access to it by opening{' '}
            <span className="allowed-url">
              {origin}
              <img
                className="icon"
                style={{ marginLeft: 2 }}
                src="rabby-internal://assets/icons/alert-insecurity/icon-external-url.svg"
              />
            </span>
          </div>
        ) : (
          <div className="inner">
            <img
              className="icon"
              style={{ marginRight: 2 }}
              src="rabby-internal://assets/icons/alert-insecurity/icon-readonly.svg"
            />
            This page doesn't belong to the current Dapp, so it can only be
            viewed.
          </div>
        )}
      </div>
      <div className="webview-wrapper">
        {/* <div className='webview-transparent-mask'></div> */}
        <webview ref={webviewRef} src={urlInfo.url} />
      </div>
    </Modal>
  );
}

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(<AlertInsecurity />);
