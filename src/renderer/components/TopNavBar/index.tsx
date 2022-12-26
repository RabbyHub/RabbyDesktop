import clsx from 'clsx';
import { CHAINS, CHAINS_ENUM } from '@debank/common';

import {
  IconArrowDown,
  RcIconHistoryGoBack,
  RcIconReload,
} from '@/../assets/icons/top-bar';

import { Divider } from 'antd';
import { useDappNavigation } from '@/renderer/hooks-shell/useDappNavigation';
import { useConnectedSite } from '@/renderer/hooks/useRabbyx';
import { useCallback, useRef } from 'react';
import {
  hideMainwinPopup,
  showMainwinPopup,
} from '@/renderer/ipcRequest/mainwin-popup';
import { useClickOutSide } from '@/renderer/hooks/useClick';
import styles from './index.module.less';
import { CurrentAccountAndNewAccount } from '../CurrentAccount';

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
  onClick,
}: {
  chain: CHAINS_ENUM;
  className?: string;
  onClick?: React.DOMAttributes<HTMLDivElement>['onClick'];
}) => {
  const divRef = useRef<HTMLDivElement>(null);

  useClickOutSide(divRef, () => {
    hideMainwinPopup('switch-chain');
  });
  return (
    <div
      className={clsx(styles.chain, className)}
      onClick={onClick}
      ref={divRef}
    >
      <img className={styles.logo} src={CHAINS[chain].logo} alt={chain} />
      <span className={styles.chainName}>{CHAINS[chain].name}</span>
      <img src={IconArrowDown} alt="" />
    </div>
  );
};

export const TopNavBar = () => {
  const { tabOrigin, navActions, selectedTabInfo, activeTab } =
    useDappNavigation();

  const { currentConnectedSite } = useConnectedSite(tabOrigin);

  const handleCloseTab = useCallback(() => {
    if (activeTab?.id) {
      chrome.tabs.remove(activeTab?.id);
    }
  }, [activeTab?.id]);

  return (
    <div className={styles.main}>
      <div className={styles.left}>
        <RiskArea />
        <Divider type="vertical" className={styles.divider} />
        <div className={styles.url}>{activeTab?.url || ''}</div>
        <div className={styles.dockRight}>
          <div className={styles.historyBar}>
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
            <RcIconReload onClick={navActions.onReloadButtonClick} />
          </div>
          {!!currentConnectedSite?.isConnected &&
            !!currentConnectedSite?.chain && (
              <ConnectedChain
                chain={currentConnectedSite.chain}
                onClick={(event) => {
                  const el = event.currentTarget as HTMLDivElement;
                  const rect = el.getBoundingClientRect();

                  showMainwinPopup(
                    { x: rect.x, y: rect.bottom + 10 },
                    {
                      type: 'switch-chain',
                      dappTabInfo: {
                        id: activeTab?.id,
                        url: activeTab?.url,
                      },
                    }
                  );
                }}
              />
            )}
        </div>
        <div className={styles.close} onClick={handleCloseTab}>
          <img src="rabby-internal://assets/icons/top-bar/close.svg" />
        </div>
      </div>

      <CurrentAccountAndNewAccount className={styles.right} />
    </div>
  );
};
