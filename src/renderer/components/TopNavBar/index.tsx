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
} from 'react';
import { detectOS } from '@/isomorphic/os';
import classNames from 'classnames';

import { useCurrentConnection } from '@/renderer/hooks/rabbyx/useConnection';
import { useSwitchChainModal } from '@/renderer/hooks/useSwitchChainModal';
import { copyText } from '@/renderer/utils/clipboard';
import { useMatchURLBaseConfig } from '@/renderer/hooks-ipc/useAppDynamicConfig';
import { useWindowState } from '@/renderer/hooks-shell/useWindowState';
import { formatDappURLToShow } from '@/isomorphic/dapp';
import { toastTopMessage } from '@/renderer/ipcRequest/mainwin-popupview';
import styles from './index.module.less';
// import { TipsWrapper } from '../TipWrapper';

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
    return formatDappURLToShow(activeTab?.url || '');
  }, [activeTab?.url]);

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
          className={styles.url}
          style={{ ...(navTextColor && { color: navTextColor }) }}
          onClick={async () => {
            if (!dappURLToShow) return;
            await copyText(dappURLToShow);
            toastTopMessage({
              data: {
                type: 'success',
                content: 'Copied url',
              },
            });
          }}
        >
          {/* <TipsWrapper
            placement="bottom"
            hoverTips="Copy URL"
            clickTips="Copied"
          > */}
          <span>{dappURLToShow}</span>
          {/* </TipsWrapper> */}
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
