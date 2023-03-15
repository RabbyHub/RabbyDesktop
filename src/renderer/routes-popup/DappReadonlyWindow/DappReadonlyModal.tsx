/// <reference path="../../preload.d.ts" />

import { useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Modal } from 'antd';
import classNames from 'classnames';

import { canoicalizeDappUrl } from 'isomorphic/url';
import { useSettings } from '@/renderer/hooks/useSettings';

import '@/renderer/css/windicss';
import '@/renderer/utils/rendererReport';

import { openExternalUrl } from '@/renderer/ipcRequest/app';
import { RcIconClose, RcIconLoading } from '@/../assets/icons/readonly-modal';
import { showMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import { DappFavicon } from '@/renderer/components/DappFavicon';
import styles from './DappReadonlyModal.module.less';
import useDragHeadbar from '../../hooks/useDragheadbar';

function closeView() {
  window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_rpc:dapp-tabs:close-safe-view'
  );
}

closeView();

function InnerRedirect({
  nonSameOrigin,
  isLoadingFavicon,
  targetInfo,
}: {
  nonSameOrigin: INonSameDomainAction;
  isLoadingFavicon?: boolean;
  targetInfo: ReturnType<typeof canoicalizeDappUrl>;
}) {
  return (
    <>
      <header className={styles.header}>
        <div className={styles.avatarWrapper}>
          {isLoadingFavicon ? (
            <div className={classNames(styles.loadingWrapper)}>
              <RcIconLoading
                style={{
                  animation: 'rotate 1s linear infinite',
                }}
              />
            </div>
          ) : (
            <DappFavicon
              src={
                nonSameOrigin.favIcon?.faviconBase64 ||
                nonSameOrigin.favIcon?.faviconUrl
              }
              origin={targetInfo.secondaryDomain[0].toLocaleUpperCase()}
              className={styles.avatar}
            />
          )}
          <span className={styles.link}>{targetInfo.origin}</span>
        </div>
      </header>
      <div className={classNames(styles.tipContainer, 'mt-30px pb-60px')}>
        The page you want to open has not been added as a Dapp.
      </div>
      <div className={classNames(styles.buttonContainer)}>
        <Button
          className={classNames(styles.button, styles.J_add)}
          type="primary"
          onClick={() => {
            closeView();
            openExternalUrl(nonSameOrigin.url);
          }}
        >
          Open in browser
        </Button>

        <Button
          className={classNames(styles.button, styles.J_openInBrowser)}
          type="text"
          onClick={() => {
            closeView();
            showMainwinPopupview({
              type: 'dapps-management',
              state: {
                newDappOrigin: targetInfo.origin,
              },
            });
          }}
        >
          Add as dapp
        </Button>
      </div>
    </>
  );
}

export default function DappReadonlyModal() {
  const [nonSameOrigin, setNonSameOrigin] = useState<INonSameDomainAction>({
    url: '',
    sourceURL: '',
    status: 'loaded',
    favIcon: null,
  });
  const { fetchState } = useSettings();
  useEffect(() => {
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:dapp-tabs:open-safe-view',
      (state) => {
        fetchState();
        setNonSameOrigin(state);
      }
    );
  }, [fetchState]);

  const { targetInfo, isLoadingFavicon } = useMemo(() => {
    const target = canoicalizeDappUrl(nonSameOrigin.url);

    return {
      targetInfo: target,
      isLoadingFavicon: nonSameOrigin.status === 'start-loading',
      // isLoadingFavicon: true,
    };
  }, [nonSameOrigin.url, nonSameOrigin.status]);

  useDragHeadbar();

  if (!nonSameOrigin.url) return null;

  return (
    <Modal
      width={520}
      centered
      className={classNames(styles.DappReadonlyModal)}
      wrapClassName={classNames(styles.DappReadonlyModalWrap)}
      open={!!nonSameOrigin.url}
      maskClosable
      mask
      onCancel={() => {
        closeView();
      }}
      closeIcon={<RcIconClose className={styles.closeIcon} />}
      footer={null}
    >
      <InnerRedirect
        nonSameOrigin={nonSameOrigin}
        targetInfo={targetInfo}
        isLoadingFavicon={isLoadingFavicon}
      />
    </Modal>
  );
}
