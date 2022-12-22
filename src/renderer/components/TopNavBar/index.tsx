import clsx from 'clsx';
import { CHAINS, CHAINS_ENUM } from '@debank/common';

import { IconArrowDown } from '@/../assets/icons/top-bar';

import { Divider } from 'antd';
import { useDappNavigation } from '@/renderer/hooks-shell/useDappNavigation';
import { useConnectedSite } from '@/renderer/hooks/useRabbyx';
import { useNavigate } from 'react-router-dom';
import styles from './index.module.less';

const RiskArea = () => {
  return (
    <div className={styles.risk}>
      <img
        className={styles.icon}
        src="rabby-internal://assets/icons/native-tabs/icon-shield-default.svg"
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

const CurrentAccount = ({
  name,
  address,
  onClick,
}: {
  name: string;
  address: string;
  onClick: () => void;
}) => {
  return (
    <div className={styles.account} onClick={onClick}>
      <img
        className={styles.logo}
        src="rabby-internal://assets/icons/import/key.svg"
        alt="key"
      />
      <span>{name}</span>
      <span className={styles.addr}>
        {address.slice(0, 4)}...{address.slice(-4)}
        <img src="rabby-internal://assets/icons/top-bar/select.svg" />
      </span>
    </div>
  );
};

const AddNewAccount = () => {
  const navigate = useNavigate();
  const gotoAddNewAccount = () => {
    navigate('/import-by/private-key');
  };
  return (
    <div className={styles.addNewAccount} onClick={gotoAddNewAccount}>
      <img src="rabby-internal://assets/icons/top-bar/add-address.svg" />
    </div>
  );
};

const tmpData = {
  url: 'https://app.uniswap.org',
  chain: CHAINS_ENUM.ETH,
  walletName: 'ledger#122',
  address: '0x5853ed4f26a3fcea565b3fbc698bb19cdf6deb85',
};

export const TopNavBar = () => {
  const { tabOrigin, navActions, selectedTabInfo, activeTab } =
    useDappNavigation();
  const { currentConnectedSite } = useConnectedSite(tabOrigin);

  const handleCloseTab = () => {
    // TODO
    throw new Error('Function not implemented.');
  };

  const handleAccount = () => {
    // TODO
    throw new Error('Function not implemented.');
  };

  return (
    <div className={styles.main}>
      <div className={styles.left}>
        <RiskArea />
        <Divider type="vertical" className={styles.divider} />
        <div className={styles.url}>{activeTab?.url || ''}</div>
        {currentConnectedSite && (
          <ConnectedChain className="" chain={currentConnectedSite.chain} />
        )}
        <div className={styles.close} onClick={handleCloseTab}>
          <img src="rabby-internal://assets/icons/top-bar/close.svg" />
        </div>
      </div>

      <div className={styles.right}>
        <CurrentAccount
          name={tmpData.walletName}
          address={tmpData.address}
          onClick={handleAccount}
        />
        <AddNewAccount />
      </div>
    </div>
  );
};
