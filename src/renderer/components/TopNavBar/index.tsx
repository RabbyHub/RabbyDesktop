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
import { useCallback } from 'react';
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
  onClick?: () => void;
}) => {
  return (
    <div className={clsx(styles.chain, className)} onClick={onClick}>
      <img className={styles.logo} src={CHAINS[chain].logo} alt={chain} />
      <span>{CHAINS[chain].name}</span>
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
            <ConnectedChain chain={currentConnectedSite.chain} />
          )}
        <div className={styles.close} onClick={handleCloseTab}>
          <img src="rabby-internal://assets/icons/top-bar/close.svg" />
        </div>
      </div>

      <CurrentAccountAndNewAccount className={styles.right} />
    </div>
  );
};
