import clsx from 'clsx';
import { CHAINS, CHAINS_ENUM } from '@debank/common';

import {
  IconArrowDown,
  RcIconHistoryGoBack,
  RcIconReload,
  RcIconStopload,
} from '@/../assets/icons/top-bar';

import { Divider, message } from 'antd';
import { useDappNavigation } from '@/renderer/hooks-shell/useDappNavigation';
import { useConnectedSite } from '@/renderer/hooks/useRabbyx';
import { useCallback, useRef, useState, useMemo } from 'react';
import { useClickOutSide } from '@/renderer/hooks/useClick';
import { detectOS } from '@/isomorphic/os';
import classNames from 'classnames';
import { useZPopupLayerOnMain } from '@/renderer/hooks/usePopupWinOnMainwin';
import {
  hideMainwinPopup,
  showMainwinPopup,
} from '@/renderer/ipcRequest/mainwin-popup';
import { copyText } from '@/renderer/utils/clipboard';
import styles from './index.module.less';
import { toastMessage } from '../TransparentToast';

const isDarwin = detectOS() === 'darwin';

const RiskArea = () => {
  return (
    <div className={styles.risk}>
      <img
        className={styles.icon}
        src="rabby-internal://assets/icons/top-bar/icon-shield-ok.svg"
      />
      <div className={styles.text}>No risk found</div>
    </div>
  );
};

const ConnectedChain = ({
  chain,
  className,
  ...others
}: {
  chain: CHAINS_ENUM;
} & React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>) => {
  const divRef = useRef<HTMLDivElement>(null);

  useClickOutSide(divRef, () => {
    hideMainwinPopup('switch-chain-tmp');
  });
  const zActions = useZPopupLayerOnMain();
  useClickOutSide(divRef, () => {
    zActions.hideZSubview('switch-chain');
  });
  return (
    <div className={clsx(styles.chain, className)} ref={divRef} {...others}>
      <img className={styles.logo} src={CHAINS[chain].logo} alt={chain} />
      <span className={styles.chainName}>{CHAINS[chain].name}</span>
      <img src={IconArrowDown} alt="" />
    </div>
  );
};

export const TopNavBar = () => {
  const [chainHover, setChainHover] = useState(false);

  const hiddenHistoryOnMouseOver = useMemo(
    () => ({
      onMouseEnter: () => {
        setChainHover(true);
      },
      onMouseLeave: () => {
        setChainHover(false);
      },
    }),
    []
  );

  const { tabOrigin, navActions, selectedTabInfo, activeTab } =
    useDappNavigation();

  const { currentConnectedSite } = useConnectedSite(tabOrigin);

  const handleCloseTab = useCallback(() => {
    if (activeTab?.id) {
      chrome.tabs.remove(activeTab?.id);
    }
  }, [activeTab?.id]);

  const zActions = useZPopupLayerOnMain();

  return (
    <div className={styles.main}>
      {/* keep this element in first to make it bottom, or move it last to make it top */}
      {isDarwin && <div className={classNames(styles.macOSGasket)} />}
      <div className={styles.left} data-nodrag>
        <RiskArea />
        <Divider type="vertical" className={styles.divider} />
        {activeTab?.status === 'loading' && (
          <img
            className={styles.loadingIcon}
            src="rabby-internal://assets/icons/top-bar/icon-dapp-nav-loading.svg"
          />
        )}
        <div className={styles.url}>
          <span
            className={styles.urlText}
            onClick={async () => {
              if (!activeTab?.url) return;
              await copyText(activeTab.url);
              toastMessage({
                type: 'success',
                content: 'Copied url',
                className: 'mainwindow-default-tip',
                duration: 1,
              });
            }}
          >
            {activeTab?.url || ''}
          </span>
        </div>
        <div className={clsx(styles.historyBar, chainHover && styles.hidden)}>
          <RcIconHistoryGoBack
            className={clsx(
              styles.goBack,
              selectedTabInfo?.canGoBack && styles.active
            )}
            onClick={navActions.onGoBackButtonClick}
          />
          <RcIconHistoryGoBack
            className={clsx(
              styles.goForward,
              selectedTabInfo?.canGoForward && styles.active
            )}
            onClick={navActions.onGoForwardButtonClick}
          />
          {activeTab?.status === 'loading' ? (
            <RcIconStopload onClick={navActions.onStopLoadingButtonClick} />
          ) : (
            <RcIconReload onClick={navActions.onReloadButtonClick} />
          )}
        </div>
        {!!currentConnectedSite?.isConnected && !!currentConnectedSite?.chain && (
          <div className={styles.connectChainBox} {...hiddenHistoryOnMouseOver}>
            <ConnectedChain
              chain={currentConnectedSite.chain}
              onClick={(event) => {
                const el = event.currentTarget as HTMLDivElement;
                const rect = el.getBoundingClientRect();

                showMainwinPopup(
                  { x: rect.x, y: rect.bottom + 10 },
                  {
                    type: 'switch-chain-tmp',
                    dappTabInfo: {
                      id: activeTab?.id,
                      url: activeTab?.url,
                    },
                  }
                );

                // zActions.showZSubview('switch-chain', {
                //   dappTabInfo: {
                //     id: activeTab?.id,
                //     url: activeTab?.url,
                //   },
                // });
              }}
            />
          </div>
        )}
        <div
          className={styles.close}
          onClick={handleCloseTab}
          {...hiddenHistoryOnMouseOver}
        >
          <img src="rabby-internal://assets/icons/top-bar/close.svg" />
        </div>
      </div>
    </div>
  );
};
