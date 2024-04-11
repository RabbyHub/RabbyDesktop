import { useMemo, useState } from 'react';
import { Modal as RModal } from '@/renderer/components/Modal/Modal';
import { atom, useAtom } from 'jotai';
import { CHAINS, Chain } from '@debank/common';
import PillsSwitch from '@/renderer/components/PillsSwitch';
import clsx from 'clsx';
import { TooltipWithMagnetArrow } from '@/renderer/components/Tooltip/TooltipWithMagnetArrow';
import { Tabs } from 'antd';
import { getChainList } from '@/renderer/utils/chain';
import styles from './index.module.less';

const showSupportedChainsAtom = atom(false);
export function useSupportedChainsModal() {
  const [showSupportedChains, setShowSupportedChains] = useAtom(
    showSupportedChainsAtom
  );

  return {
    showSupportedChains,
    setShowSupportedChains,
  };
}

const List = ({ list }: { list: Chain[] }) => {
  return (
    <div className="max-h-[500px] chain-list-wrapper">
      <div className="chain-list">
        {list.map((item) => {
          return (
            <div className="chain-list-item" key={item.id}>
              <img src={item.logo} alt="" />
              <TooltipWithMagnetArrow
                title={item.name}
                className="rectangle w-[max-content]"
              >
                <span className="overflow-hidden overflow-ellipsis">
                  {item.name}
                </span>
              </TooltipWithMagnetArrow>
            </div>
          );
        })}
        {list.length % 2 !== 0 && <div className="chain-list-item" />}
      </div>
    </div>
  );
};

const renderTabBar = () => <>{null}</>;

export default function ModalSupportedChains() {
  const { showSupportedChains, setShowSupportedChains } =
    useSupportedChainsModal();

  const [selectedTab, onTabChange] = useState<'mainnet' | 'testnet'>('mainnet');

  const { mainnet: mainnetList, testnet: testnetList } = useMemo(() => {
    const sortedChains = getChainList('mainnet').sort((a, b) => {
      if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
      return 1;
    });

    return {
      mainnet: sortedChains.filter((item) => !item.isTestnet),
      testnet: sortedChains.filter((item) => item.isTestnet),
    };
  }, []);

  return (
    <RModal
      visible={showSupportedChains}
      width={480}
      centered
      className={styles.ModalSupportedChains}
      onCancel={() => {
        setShowSupportedChains(false);
      }}
      title={
        <span className="text-r-neutral-title-1 text-20 font-medium">
          {`${getChainList('mainnet').length} chains supported`}
        </span>
      }
    >
      {/* <PillsSwitch
        value={selectedTab}
        onTabChange={onTabChange}
        className="bg-r-neutral-line flex w-[232px] mx-[auto] my-20px h-[36px] p-[4px]"
        itemClassname={clsx(
          'rounded-0 w-[112px] py-[7px] text-[13px] font-medium'
        )}
        // @ts-expect-error
        style={{ '--active-bg': 'rgba(0, 0, 0, 0.20)' }}
        itemClassnameActive="bg-[var(--active-bg)] text-r-neutral-title-2"
        itemClassnameInActive="text-r-neutral-foot"
        options={
          [
            {
              key: 'mainnet',
              label: `Mainnets (${mainnetList.length})`,
            },
            {
              key: 'testnet',
              label: `Testnets (${testnetList.length})`,
            },
          ] as const
        }
      /> */}

      <Tabs
        className="h-full max-h-[500px] overflowy-y-auto mt-[20px]"
        renderTabBar={renderTabBar}
        activeKey={selectedTab}
      >
        <Tabs.TabPane key="mainnet" destroyInactiveTabPane={false}>
          <List list={mainnetList} />
        </Tabs.TabPane>
        <Tabs.TabPane key="testnet">
          <List list={testnetList} />
        </Tabs.TabPane>
      </Tabs>
    </RModal>
  );
}
