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
  forwardRef,
  ForwardedRef,
  useMemo,
  useRef,
} from 'react';
import { detectClientOS } from '@/isomorphic/os';
import classNames from 'classnames';

import { useCurrentConnection } from '@/renderer/hooks/rabbyx/useConnection';
import { useSwitchChainModal } from '@/renderer/hooks/useSwitchChainModal';
import { copyText } from '@/renderer/utils/clipboard';
import { useMatchURLBaseConfig } from '@/renderer/hooks-ipc/useAppDynamicConfig';
import { useWindowState } from '@/renderer/hooks-shell/useWindowState';
import { formatDappURLToShow } from '@/isomorphic/dapp';
import { useGhostTooltip } from '@/renderer/routes-popup/TopGhostWindow/useGhostWindow';
import { useLocation } from 'react-router-dom';
import styles from './index.module.less';
// import { TipsWrapper } from '../TipWrapper';

const isDarwin = detectClientOS() === 'darwin';

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
  const [nonce, setNonce] = useState(0);

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

  const { onDarwinToggleMaxmize } = useWindowState();

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

  const dappURLToShow = useMemo(() => {
    if (selectedTabInfo?.dapp?.type === 'localfs') {
      return formatDappURLToShow(selectedTabInfo?.dapp?.id || '');
    }
    return formatDappURLToShow(activeTab?.url || '');
  }, [selectedTabInfo?.dapp, activeTab?.url]);

  const [{ showTooltip, hideTooltip }] = useGhostTooltip({
    mode: 'controlled',
    defaultTooltipProps: {
      title: 'You should never see this tooltip',
      placement: 'bottom',
    },
  });
  const autoHideOnMouseLeaveRef = useRef(true);
  const hoverPosition = useRef<any>();

  const autoHideTimer = useRef<NodeJS.Timeout>();

  const l = useLocation();

  useEffect(
    () => () => {
      hideTooltip(0);
      autoHideOnMouseLeaveRef.current = true;
      clearInterval(autoHideTimer.current);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [l]
  );

  return (
    <div className={styles.main} onDoubleClick={onDarwinToggleMaxmize}>
      {/* keep this element in first to make it bottom, or move it last to make it top */}
      {isDarwin && <div className={classNames(styles.macOSGasket)} />}
      <div
        className={styles.left}
        style={{
          ...(navBackgroundColor && { backgroundColor: navBackgroundColor }),
        }}
        data-nodrag
        onDoubleClick={(evt) => {
          evt.stopPropagation();
        }}
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
          className={clsx(styles.url, 'h-[100%] flex items-center')}
          style={{ ...(navTextColor && { color: navTextColor }) }}
          onClick={async () => {
            if (!dappURLToShow) return;
            await copyText(dappURLToShow);

            showTooltip(
              // adjust the position based on the rect of trigger element
              {
                ...hoverPosition.current,
              },
              {
                title: 'Copied',
                placement: 'bottom',
              },
              { autoHideTimeout: 3000 }
            );
            autoHideOnMouseLeaveRef.current = false;
            autoHideTimer.current = setTimeout(() => {
              autoHideOnMouseLeaveRef.current = true;
              hideTooltip(0);
            }, 3000);
          }}
          onMouseEnter={(event) => {
            if (!dappURLToShow) return;
            if (!autoHideOnMouseLeaveRef.current) return;

            const rect = (event.target as HTMLDivElement)
              .getBoundingClientRect()
              .toJSON();

            hoverPosition.current = {
              ...rect,
              left: event.clientX - 30 / 2,
              top: event.clientY - 20,
              height: 5,
              width: 30,
            };

            showTooltip(
              // adjust the position based on the rect of trigger element
              {
                ...hoverPosition.current,
              },
              {
                title: 'Copy URL',
                placement: 'bottom',
              }
            );
          }}
          onMouseLeave={() => {
            if (autoHideOnMouseLeaveRef.current) {
              hideTooltip(0);
            }
          }}
        >
          {dappURLToShow}
        </div>
        <div className={clsx(styles.historyBar)}>
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
        <div className={styles.connectChainBox}>
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
        <div className={styles.close} onClick={handleCloseTab}>
          <img src="rabby-internal://assets/icons/top-bar/close.svg" />
        </div>
      </div>
    </div>
  );
};
