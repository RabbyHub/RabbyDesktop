import clsx from 'clsx';
import { CHAINS, CHAINS_ENUM } from '@debank/common';

import {
  IconArrowDown,
  RcIconHistoryGoBack,
  RcIconReload,
  RcIconStopload,
  RcIconShield,
} from '@/../assets/icons/top-bar';

import { Divider } from 'antd';
import { useDappNavigation } from '@/renderer/hooks-shell/useDappNavigation';
import {
  useEffect,
  useCallback,
  useState,
  useMemo,
  forwardRef,
  ForwardedRef,
} from 'react';
import { detectOS } from '@/isomorphic/os';
import classNames from 'classnames';

import { useCurrentConnection } from '@/renderer/hooks/rabbyx/useConnection';
import { useSwitchChainModal } from '@/renderer/hooks/useSwitchChainModal';
import { copyText } from '@/renderer/utils/clipboard';
import { useMatchURLBaseConfig } from '@/renderer/hooks-ipc/useAppDynamicConfig';
import styles from './index.module.less';
import { toastMessage } from '../TransparentToast';

const isDarwin = detectOS() === 'darwin';

const RiskArea = ({
  style,
  iconColor,
}: React.PropsWithChildren<{
  style?: React.CSSProperties;
  iconColor?: string;
}>) => {
  return (
    <div style={style} className={styles.risk}>
      <RcIconShield
        style={{ ...(iconColor && { color: iconColor }) }}
        className={styles.icon}
      />
      <div className={styles.text}>No risk found</div>
    </div>
  );
};

const ConnectedChain = forwardRef(
  (
    {
      chain,
      className,
      ...others
    }: {
      chain: CHAINS_ENUM;
    } & React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLDivElement>,
      HTMLDivElement
    >,
    ref: ForwardedRef<HTMLDivElement>
  ) => {
    return (
      <div className={clsx(styles.chain, className)} ref={ref} {...others}>
        <img className={styles.logo} src={CHAINS[chain].logo} alt={chain} />
        <span className={styles.chainName}>{CHAINS[chain].name}</span>
        <img src={IconArrowDown} alt="" />
      </div>
    );
  }
);

export const TopNavBar = () => {
  const [chainHover, setChainHover] = useState(false);
  const [nonce, setNonce] = useState(0);

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

  const { navActions, selectedTabInfo, activeTab } = useDappNavigation();

  const { switchChain, currentSite } = useCurrentConnection(
    {
      id: activeTab?.id,
      url: activeTab?.url,
    },
    nonce
  );

  const handleCloseTab = useCallback(() => {
    if (activeTab?.id) {
      chrome.tabs.remove(activeTab?.id);
    }
  }, [activeTab?.id]);

  const { ref: divRef, open } = useSwitchChainModal<HTMLDivElement>((chain) => {
    switchChain(chain);
  });

  const { navTextColor, navIconColor, navDividerColor, navBackgroundColor } =
    useMatchURLBaseConfig(activeTab?.url);

  useEffect(
    () =>
      window.rabbyDesktop.ipcRenderer.on(
        '__internal_push:rabbyx:session-broadcast-forward-to-desktop',
        (payload) => {
          if (payload.event !== 'createSession') return;
          const { data } = payload;
          const [tabId] = data.split('-');
          if (Number(tabId) === activeTab?.id) {
            setNonce(nonce + 1);
          }
        }
      ),
    [nonce, activeTab]
  );

  return (
    <div className={styles.main}>
      {/* keep this element in first to make it bottom, or move it last to make it top */}
      {isDarwin && <div className={classNames(styles.macOSGasket)} />}
      <div
        className={styles.left}
        style={{
          ...(navBackgroundColor && { backgroundColor: navBackgroundColor }),
        }}
        data-nodrag
      >
        <RiskArea style={{ color: navTextColor }} iconColor={navIconColor} />
        <Divider
          type="vertical"
          className={classNames(styles.divider)}
          style={{ ...(navIconColor && { borderColor: navDividerColor }) }}
        />
        {activeTab?.status === 'loading' && (
          <img
            className={styles.loadingIcon}
            src="rabby-internal://assets/icons/top-bar/icon-dapp-nav-loading.svg"
          />
        )}
        <div
          className={styles.url}
          style={{ ...(navTextColor && { color: navTextColor }) }}
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
        </div>
        <div className={clsx(styles.historyBar, chainHover && styles.hidden)}>
          <RcIconHistoryGoBack
            style={{ color: navIconColor }}
            className={clsx(
              styles.goBack,
              selectedTabInfo?.canGoBack && styles.active
            )}
            onClick={navActions.onGoBackButtonClick}
          />
          <RcIconHistoryGoBack
            style={{ color: navIconColor }}
            className={clsx(
              styles.goForward,
              selectedTabInfo?.canGoForward && styles.active
            )}
            onClick={navActions.onGoForwardButtonClick}
          />
          {activeTab?.status === 'loading' ? (
            <RcIconStopload
              style={{ color: navIconColor }}
              onClick={navActions.onStopLoadingButtonClick}
            />
          ) : (
            <RcIconReload
              style={{ color: navIconColor }}
              onClick={navActions.onReloadButtonClick}
            />
          )}
        </div>
        <div className={styles.connectChainBox} {...hiddenHistoryOnMouseOver}>
          <ConnectedChain
            ref={divRef}
            chain={currentSite ? currentSite.chain : CHAINS_ENUM.ETH}
            onClick={() => {
              open({
                value: currentSite ? currentSite.chain : CHAINS_ENUM.ETH,
              });
            }}
          />
        </div>
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
