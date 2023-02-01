/// <reference path="../../preload.d.ts" />

import { useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Modal } from 'antd';
import classNames from 'classnames';

import { canoicalizeDappUrl } from 'isomorphic/url';
import { useSettings } from '@/renderer/hooks/useSettings';

import '@/renderer/css/windicss';

import { openExternalUrl } from '@/renderer/ipcRequest/app';
import { RcIconClose, RcIconLoading } from '@/../assets/icons/readonly-modal';
import { showMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import styles from './DappReadonlyModal.module.less';
import useDragHeadbar from '../../hooks/useDragheadbar';

function closeView() {
  window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_rpc:dapp-tabs:close-safe-view'
  );
}

closeView();

function InnnerVisitOther({
  externalOrigin,
  externalURL,
}: {
  externalOrigin: string;
  externalURL: string;
}) {
  return (
    <>
      <header className={styles.header}>
        <span className={styles.title}>Visiting new site</span>
      </header>
      <div className={classNames(styles.tipContainer, 'mt-16px')}>
        You're about to visit a new page with different domain name from the
        current Dapp. You can open it in your browser.
      </div>
      <div className={styles.externalLinkContainer}>
        <img src="rabby-internal://assets/icons/readonly-modal/icon-link.svg" />
        <span className={styles.link}>{externalURL}</span>
      </div>
      <div className={styles.buttonContainer}>
        <Button
          className={classNames(styles.button, styles.J_openInBrowser)}
          type="default"
          onClick={() => {
            openExternalUrl(externalURL);
          }}
        >
          Open in browser
        </Button>
      </div>
    </>
  );
}

function InnerSameOrigin({
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
            <Avatar
              src={
                nonSameOrigin.favIcon?.faviconBase64 ||
                nonSameOrigin.favIcon?.faviconUrl
              }
              className={styles.avatar}
              size={40}
            >
              {targetInfo.domain[0].toLocaleUpperCase()}
            </Avatar>
          )}
          <span className={styles.link}>{targetInfo.origin}</span>
        </div>
      </header>
      <div className={classNames(styles.tipContainer, 'mt-30px pb-60px')}>
        The domain name of the new page is detected to be different from that of
        the current Dapp. The page will open in your browser
      </div>
      <div className={classNames(styles.buttonContainer)}>
        <Button
          className={classNames(styles.button, styles.J_add)}
          type="primary"
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
          Add a dapp
        </Button>

        <Button
          className={classNames(styles.button, styles.J_openInBrowser)}
          type="text"
          onClick={() => {
            openExternalUrl(nonSameOrigin.url);
          }}
        >
          Open in browser
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

  const { targetInfo, toSameDomain, isLoadingFavicon } = useMemo(() => {
    const target = canoicalizeDappUrl(nonSameOrigin.url);
    const source = canoicalizeDappUrl(nonSameOrigin.sourceURL);

    return {
      targetInfo: target,
      toSameDomain: target.domain === source.domain,
      isLoadingFavicon: nonSameOrigin.status === 'start-loading',
      // isLoadingFavicon: true,
    };
  }, [nonSameOrigin.url, nonSameOrigin.sourceURL, nonSameOrigin.status]);

  useDragHeadbar();

  // useEffect(() => {
  //   if (!nonSameOrigin.url) return;

  //   window.rabbyDesktop.ipcRenderer.invoke('parse-favicon', nonSameOrigin.url)
  //     .then(res => {
  //       if (res.error) {
  //         console.error(res.error);
  //         return;
  //       }

  //       setNonSameOrigin(prev => {
  //         return {
  //           ...prev,
  //           status: 'loaded',
  //           favIcon: res.favicon,
  //         }
  //       });
  //     });
  // }, [nonSameOrigin.url]);

  if (!nonSameOrigin.url) return null;

  return (
    <Modal
      width={520}
      centered
      className={classNames(
        styles.DappReadonlyModal,
        toSameDomain ? styles.J_sameDomain : styles.J_external
      )}
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
      {!toSameDomain ? (
        <InnnerVisitOther
          externalOrigin={targetInfo.origin}
          externalURL={nonSameOrigin.url}
        />
      ) : (
        <InnerSameOrigin
          nonSameOrigin={nonSameOrigin}
          targetInfo={targetInfo}
          isLoadingFavicon={isLoadingFavicon}
        />
      )}
    </Modal>
  );
}
