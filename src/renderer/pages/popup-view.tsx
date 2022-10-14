/// <reference path="../preload.d.ts" />

import { createRoot } from 'react-dom/client';
import '../css/style.less';

import './popup-view.less';
import { Modal } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { canoicalizeDappUrl, integrateQueryToUrl, parseQueryString } from 'isomorphic/url';

const INIT_URL = decodeURIComponent(parseQueryString().__checking_url__ || '');

const isProd = process.env.NODE_ENV === 'production';

function formatUrl (url: string) {
  return integrateQueryToUrl(url, {
    _rbd_insecurity_alert: 'true',
  })
}

export default function SecurityCheck() {
  const [ urlInfo, setUrlInfo ] = useState({
    url: formatUrl(INIT_URL),
    isExisted: false
  });

  const { origin } = useMemo(() => {
    return canoicalizeDappUrl(urlInfo.url);
  }, [urlInfo.url])

  useEffect(() => {
    return window.rabbyDesktop.ipcRenderer.on('__internal_alert-security-url', ({ url, isExisted }) => {
      setUrlInfo({url, isExisted});
    });
  }, []);

  if (!urlInfo.url) return null;

  return (
    <Modal
      className='modal-security-check'
      wrapClassName='modal-security-check-wrap'
      open
      // enable on debug
      maskClosable={!isProd}
      mask
      centered
      closable={false}
      onCancel={() => {
        window.rabbyDesktop.ipcRenderer.sendMessage('__internal_close-security-check-content')
      }}
      footer={null}
    >
      <div
        className='check-header'
        // style={{
        //   backgroundImage: `url("rabby-internal://assets/icons/security-check/modal-header.svg")`
        // }}
      >
        <img className='bg-placeholder' src="rabby-internal://assets/icons/security-check/modal-header.svg" />
        <div className='header-info'>
          <div className='check-status-text'>
            Dapp Security Engine is scanning ...
          </div>
        </div>
      </div>
      <div className='content-wrapper'>
        {/* <div className='webview-transparent-mask'></div> */}
      </div>
    </Modal>
  );
}

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(<SecurityCheck />);
