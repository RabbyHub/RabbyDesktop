import { Modal } from '@/renderer/components/Modal/Modal';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { usePrevious } from 'react-use';
import NetSwitchTabs, {
  NetSwitchTabsKey,
  useSwitchNetTab,
} from '../PillsSwitch/NetSwitchTabs';
import { HistoryList } from './components/HistoryList';
import styles from './index.module.less';
import { Empty } from './components/Empty';

const Transactions = ({
  onFilterScamClick,
  isShowTestnet,
  selectedTab,
  onTabChange,
}: {
  onFilterScamClick?(): void;
  isShowTestnet: boolean;
  selectedTab: NetSwitchTabsKey;
  onTabChange(key: NetSwitchTabsKey): void;
}) => {
  return (
    <>
      <div
        className={clsx(
          styles.transactionModalTitle,
          isShowTestnet && 'mb-[20px]'
        )}
      >
        Transactions
      </div>
      {isShowTestnet && (
        <div className="flex justify-center mb-[8px]">
          <NetSwitchTabs
            value={selectedTab}
            onTabChange={onTabChange}
            itemClassname="font-normal"
          />
        </div>
      )}
      {selectedTab === 'mainnet' ? (
        <>
          <div
            className="px-[32px] text-r-neutral-body text-[13px] leading-[16px] flex items-center mb-[13px] cursor-pointer"
            onClick={onFilterScamClick}
          >
            Hide scam transactions{' '}
            <img
              src="rabby-internal://assets/icons/transaction/icon-right.svg"
              alt=""
            />
          </div>
          <HistoryList testnet={false} key={selectedTab} />
        </>
      ) : (
        <div className="h-[647px] flex flex-col items-center justify-center">
          <img src="rabby-internal://assets/icons/common/box.svg" alt="" />
          <div className="text-[14px] text-r-neutral-foot leading-[20px]">
            Not supported for custom networks
          </div>
        </div>
      )}
    </>
  );
};

const NoScamTransactions = ({
  testnet = false,
  onBack,
}: {
  testnet?: boolean;
  onBack?(): void;
}) => {
  return (
    <>
      <div className={clsx(styles.transactionModalTitle, 'relative')}>
        <img
          src="rabby-internal://assets/icons/transaction/icon-back.svg"
          alt=""
          className="absolute left-[32px] top-1/2 transform -translate-y-1/2 cursor-pointer"
          onClick={onBack}
        />
        Hide scam transactions
      </div>
      <HistoryList testnet={testnet} isFilterScam />
    </>
  );
};

interface TransactionModalProps {
  open?: boolean;
  onClose?: () => void;
  initialTabOnOpen?: NetSwitchTabsKey;
}
export const TransactionModal = ({
  open,
  onClose,
  initialTabOnOpen,
}: TransactionModalProps) => {
  const { isShowTestnet, onTabChange, selectedTab } = useSwitchNetTab();
  const prevOpen = usePrevious(open);
  const [isFilterScam, setIsFilterScam] = useState(false);

  useEffect(() => {
    if (!prevOpen && open && initialTabOnOpen) {
      onTabChange(initialTabOnOpen);
    }
  }, [prevOpen, open, initialTabOnOpen, onTabChange]);

  useEffect(() => {
    if (open) {
      setIsFilterScam(false);
    }
  }, [open]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      className={styles.transactionModal}
      width={1070}
      centered
      destroyOnClose
    >
      {isFilterScam ? (
        <NoScamTransactions
          testnet={selectedTab === 'testnet'}
          onBack={() => {
            setIsFilterScam(false);
          }}
        />
      ) : (
        <Transactions
          key={selectedTab}
          isShowTestnet={isShowTestnet}
          selectedTab={selectedTab}
          onTabChange={onTabChange}
          onFilterScamClick={() => {
            setIsFilterScam(true);
          }}
        />
      )}
    </Modal>
  );
};
