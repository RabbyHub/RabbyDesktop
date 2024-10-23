import { Input, Modal } from 'antd';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Chain } from '@rabby-wallet/rabby-api/dist/types';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { CHAINS_ENUM } from '@/renderer/utils/constant';
import { findChainByEnum, varyAndSortChainItems } from '@/renderer/utils/chain';
import { usePreference } from '@/renderer/hooks/rabbyx/usePreference';
import { useAccountBalanceMap } from '@/renderer/hooks/rabbyx/useAccount';
import Empty from '../Empty';
import NetSwitchTabs, {
  NetSwitchTabsKey,
  useSwitchNetTab,
} from '../PillsSwitch/NetSwitchTabs';

import {
  SelectChainList,
  SelectChainListProps,
} from './components/SelectChainList';
import { LoadingBalances } from './LoadingBalances';
import './style.less';

const closeIcon = (
  <img
    src="rabby-internal://assets/icons/modal/close.svg"
    className="w-14 fill-current text-gray-content"
  />
);

const Warper = styled.div`
  .ant-input {
    &::placeholder {
      color: var(--r-neutral-foot);
    }
  }
  .select-chain-item::after {
    border-bottom-width: 0.5px !important;
  }
`;

interface ChainSelectorModalProps {
  visible: boolean;
  value?: CHAINS_ENUM;
  onCancel?(): void;
  onChange?(val: CHAINS_ENUM): void;
  connection?: boolean;
  title?: ReactNode;
  className?: string;
  supportChains?: SelectChainListProps['supportChains'];
  disabledTips?: SelectChainListProps['disabledTips'];
  hideTestnetTab?: boolean;
  showRPCStatus?: boolean;
}

const useChainSeletorList = ({
  supportChains,
  netTabKey,
}: {
  supportChains?: Chain['enum'][];
  netTabKey?: NetSwitchTabsKey;
}) => {
  const [search, setSearch] = useState('');
  const {
    preferences,
    setChainPinned,
    fetchPreference,
    updatePinnedChainList,
  } = usePreference();

  const pinned = useMemo(() => {
    return (preferences?.pinnedChain.filter((item) => findChainByEnum(item)) ||
      []) as CHAINS_ENUM[];
  }, [preferences?.pinnedChain]);

  const { matteredChainBalances: chainBalances } = useAccountBalanceMap({
    isTestnet: netTabKey === 'testnet',
  });

  const handleStarChange = (chain: CHAINS_ENUM, value) => {
    if (value) {
      setChainPinned(chain, true);
    } else {
      setChainPinned(chain, false);
    }
  };
  const handleSort = (chains: Chain[]) => {
    updatePinnedChainList(chains.map((item) => item.enum));
  };
  const { allSearched, matteredList, unmatteredList } = useMemo(() => {
    const searchKw = search?.trim().toLowerCase();
    const result = varyAndSortChainItems({
      supportChains,
      searchKeyword: searchKw,
      matteredChainBalances: chainBalances,
      pinned,
      netTabKey,
    });

    return {
      allSearched: result.allSearched,
      matteredList: searchKw ? [] : result.matteredList,
      unmatteredList: searchKw ? [] : result.unmatteredList,
    };
  }, [search, pinned, supportChains, chainBalances, netTabKey]);

  useEffect(() => {
    fetchPreference('pinnedChain');
  }, [fetchPreference]);

  return {
    matteredList,
    unmatteredList: search?.trim() ? allSearched : unmatteredList,
    allSearched,
    handleStarChange,
    handleSort,
    search,
    setSearch,
    pinned,
  };
};

export const ChainSelectorLargeModal = ({
  title,
  visible,
  onCancel,
  onChange,
  value,
  connection = false,
  className,
  supportChains,
  disabledTips,
  hideTestnetTab = false,
  showRPCStatus = false,
}: ChainSelectorModalProps) => {
  const handleCancel = () => {
    onCancel?.();
  };

  const handleChange = (val: CHAINS_ENUM) => {
    onChange?.(val);
  };

  const { isShowTestnet, selectedTab, onTabChange } = useSwitchNetTab({
    hideTestnetTab,
  });

  const { t } = useTranslation();

  const {
    matteredList,
    unmatteredList,
    handleStarChange,
    handleSort,
    search,
    setSearch,
    pinned,
  } = useChainSeletorList({
    supportChains,
    netTabKey: selectedTab,
  });

  useEffect(() => {
    if (!value || !visible) return;

    const chainItem = findChainByEnum(value);
    onTabChange(chainItem?.isTestnet ? 'testnet' : 'mainnet');
  }, [value, visible, onTabChange]);

  const { fetchBalance, isLoading, getLocalBalanceValue } =
    useAccountBalanceMap({
      isTestnet: selectedTab === 'testnet',
      disableAutoFetch: false,
    });

  useEffect(() => {
    if (!visible) {
      setSearch('');
    } else {
      fetchBalance();
    }
  }, [visible, fetchBalance, setSearch]);

  return (
    <Modal
      width={480}
      footer={null}
      open={visible}
      onCancel={handleCancel}
      className={clsx(
        'custom-popup is-support-darkmode',
        'chain-selector-large-modal',
        connection && 'connection',
        className
      )}
      closeIcon={closeIcon}
      centered
      destroyOnClose
    >
      <Warper>
        <header className={title ? 'pt-[0px]' : 'pt-[20px]'}>
          <div className="modal-title">{title}</div>
          {isShowTestnet && (
            <NetSwitchTabs
              value={selectedTab}
              onTabChange={onTabChange}
              className="h-[28px] box-content mt-[20px] mb-[20px]"
            />
          )}
          <Input
            prefix={
              <img src="rabby-internal://assets/icons/common/search.svg" />
            }
            // Search chain
            placeholder={t('component.ChainSelectorModal.searchPlaceholder')}
            onChange={(e) => setSearch(e.target.value)}
            value={search}
            allowClear
            className="bg-r-neutral-card-1 hover:border-rabby-blue-default"
          />
        </header>
        {isLoading ? (
          <div className="chain-selector-large-modal-content">
            <LoadingBalances loading={isLoading} />
          </div>
        ) : (
          <div className="chain-selector-large-modal-content">
            <SelectChainList
              supportChains={supportChains}
              data={matteredList}
              sortable={false /* !supportChains */}
              pinned={pinned as CHAINS_ENUM[]}
              onStarChange={handleStarChange}
              onSort={handleSort}
              onChange={handleChange}
              getLocalBalanceValue={getLocalBalanceValue}
              value={value}
              disabledTips={disabledTips}
              showRPCStatus={showRPCStatus}
            />
            <SelectChainList
              supportChains={supportChains}
              data={unmatteredList}
              value={value}
              pinned={pinned as CHAINS_ENUM[]}
              onStarChange={handleStarChange}
              onChange={handleChange}
              disabledTips={disabledTips}
              getLocalBalanceValue={getLocalBalanceValue}
              showRPCStatus={showRPCStatus}
            />
            {matteredList.length === 0 && unmatteredList.length === 0 ? (
              <div className="select-chain-list pt-[70px] pb-[120px]">
                <Empty>
                  {/* No chains */}
                  {t('component.ChainSelectorModal.noChains')}
                </Empty>
              </div>
            ) : null}
          </div>
        )}
      </Warper>
    </Modal>
  );
};
