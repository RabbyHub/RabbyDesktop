/// <reference path="../../preload.d.ts" />

import './DappSafeView.less';

import { Modal } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { canoicalizeDappUrl } from 'isomorphic/url';
import classNames from 'classnames';
import { useSettings } from '@/renderer/hooks/useSettings';
import useDragHeadbar from '../../hooks/useDragheadbar';

function closeView() {
  window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_rpc:dapp-tabs:close-safe-view'
  );
}

export default function DappSafeView() {
  const [urlInfo, setUrlInfo] = useState<
    INonSameDomainAction & { toExistedDapp: boolean }
  >({
    url: '',
    sourceURL: '',
    status: 'loaded',
    favIcon: null,
    toExistedDapp: false,
  });
  const {
    settings: { sidebarCollapsed },
    fetchState,
  } = useSettings();
  useEffect(() => {
    // close it by default
    closeView();

    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:dapp-tabs:open-safe-view',
      (state) => {
        fetchState();
        setUrlInfo({ ...state, toExistedDapp: false });
      }
    );
  }, [fetchState]);

  const { origin } = useMemo(() => {
    return canoicalizeDappUrl(urlInfo.url);
  }, [urlInfo.url]);

  useDragHeadbar();

  if (!urlInfo.url) return null;

  return (
    <Modal
      className={classNames(
        'modal-alert-insecurity',
        urlInfo.status === 'start-loading' && 'is-loading'
      )}
      wrapClassName={classNames(
        'modal-alert-insecurity-wrap',
        sidebarCollapsed && 'mainwin-sidebar-collapsed'
      )}
      open={!!urlInfo.url}
      maskClosable={false}
      mask
      onCancel={() => {
        closeView();
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
        {urlInfo.toExistedDapp ? (
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
      <div className="webview-loading">
        <div className="icon-wrapper">
          <img
            className="icon-shield"
            src="rabby-internal://assets/icons/alert-insecurity/icon-shield.svg"
          />
          <img
            className="icon-loading"
            src="rabby-internal://assets/icons/alert-insecurity/icon-loading.svg"
          />
        </div>
      </div>
    </Modal>
  );
}
