import { message, Tooltip } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

import { Modal as RModal } from '@/renderer/components/Modal/Modal';
import { useZPopupViewState } from '@/renderer/hooks/usePopupWinOnMainwin';
import { useBodyClassNameOnMounted } from '@/renderer/hooks/useMountedEffect';
import IconRcSearch from '@/../assets/icons/swap/search.svg?rc';
import { usePreference } from '@/renderer/hooks/rabbyx/usePreference';
import { Chain, CHAINS_ENUM, CHAINS_LIST } from '@debank/common';
import { useCustomRPC } from '@/renderer/hooks/useCustomRPC';
import { toastTopMessage } from '@/renderer/ipcRequest/mainwin-popupview';
import styles from './index.module.less';
import RabbyInput from '../AntdOverwrite/Input';
import { TipsWrapper } from '../TipWrapper';
import ChainIcon from '../ChainIcon';

type OnPinnedChanged = (
  chain: import('@debank/common').CHAINS_ENUM,
  nextPinned: boolean
) => void;

function ChainItem({
  chain,
  pinned,
  onClick,
  onPinnedChange,
  checked,
  support = true,
  disabledTips,
  isShowCustomRPC,
}: {
  chain: import('@debank/common').Chain;
  pinned: boolean;
  checked: boolean;
  onClick?: React.DOMAttributes<HTMLDivElement>['onClick'];
  onPinnedChange?: OnPinnedChanged;
  support?: boolean;
  disabledTips?: React.ReactNode;
  isShowCustomRPC?: boolean;
}) {
  return (
    <Tooltip
      trigger={['click', 'hover']}
      mouseEnterDelay={10}
      title={disabledTips}
      open={support ? false : undefined}
      placement="topLeft"
      align={{
        offset: [40, 0],
      }}
    >
      <div
        className={clsx(styles.chainItem, !support && styles.notSupport)}
        onClick={support ? onClick : undefined}
      >
        <div className={styles.chainItemLeft}>
          {/* <img src={chain.logo} className={styles.chainItemIcon} /> */}
          <ChainIcon
            chain={chain.enum}
            className={styles.chainItemIcon}
            isShowCustomRPC={isShowCustomRPC}
          />
          <div className={styles.chainItemName}>{chain.name}</div>
        </div>
        <TipsWrapper hoverTips={pinned ? 'Unpin Chain' : 'Pin Chain'}>
          <img
            className={clsx(styles.chainItemStar, pinned ? styles.block : '')}
            src={
              pinned
                ? 'rabby-internal://assets/icons/swap/pinned.svg'
                : 'rabby-internal://assets/icons/swap/unpinned.svg'
            }
            onClick={(evt) => {
              evt.stopPropagation();
              onPinnedChange?.(chain.enum, !pinned);
            }}
            alt=""
          />
        </TipsWrapper>
        {checked && (
          <img
            className={styles.chainItemChecked}
            src="rabby-internal://assets/icons/select-chain/checked.svg"
          />
        )}
      </div>
    </Tooltip>
  );
}

function searchFilter(keyword: string) {
  return (item: typeof CHAINS_LIST[number]) =>
    [item.name, item.enum, item.nativeTokenSymbol].some((token) =>
      token.toLowerCase().includes(keyword)
    );
}

function SwitchChainModalInner({
  value = CHAINS_ENUM.ETH,
  onChange,
  title = 'Select chain',
  supportChains,
  disabledTips,
  isShowCustomRPC,
}: {
  value?: CHAINS_ENUM;
  onChange: (v: CHAINS_ENUM) => void;
  title?: string;
  supportChains?: CHAINS_ENUM[];
  disabledTips?: React.ReactNode;
  isShowCustomRPC?: boolean;
}) {
  useBodyClassNameOnMounted('switch-chain-subview');

  const { preferences, setChainPinned } = usePreference();

  const [searchInput, setSearchInput] = useState('');

  const { pinnedChains, unpinnedChains } = useMemo(() => {
    const sortFn = (a: Chain, b: Chain) => {
      if (supportChains) {
        let an = 0;
        let bn = 0;
        if (supportChains.includes(a.enum)) {
          an = 1;
        }
        if (supportChains.includes(b.enum)) {
          bn = 1;
        }

        return bn - an;
      }
      return 0;
    };
    const pinnedSet = new Set(preferences.pinnedChain);
    const pinned: typeof CHAINS_LIST[number][] = [];
    const unpinned: typeof CHAINS_LIST[number][] = [];
    CHAINS_LIST.forEach((chain) => {
      if (pinnedSet.has(chain.enum)) {
        pinned.push(chain);
      } else {
        unpinned.push(chain);
      }
    });
    const keyword = searchInput?.trim().toLowerCase();
    if (!keyword) {
      return {
        pinnedChains: pinned.sort(sortFn),
        unpinnedChains: unpinned
          .sort((a, b) => a.name.localeCompare(b.name))
          .sort(sortFn),
      };
    }

    const filterFunc = searchFilter(keyword);
    const searchedPinned = pinned.filter(filterFunc);
    const searchedUnpinned = unpinned.filter(filterFunc);

    return {
      pinnedChains: searchedPinned.sort(sortFn),
      unpinnedChains: searchedUnpinned.sort(sortFn),
    };
  }, [preferences.pinnedChain, searchInput, supportChains]);

  const onPinnedChange: OnPinnedChanged = useCallback(
    (chain, nextPinned) => {
      setChainPinned(chain, nextPinned);
    },
    [setChainPinned]
  );

  const { getAllRPC, getRPCStatus } = useCustomRPC();

  useEffect(() => {
    if (isShowCustomRPC) {
      getAllRPC();
    }
  }, [getAllRPC, isShowCustomRPC]);

  const handleChange = (chain: CHAINS_ENUM) => {
    onChange?.(chain);
    if (isShowCustomRPC && getRPCStatus(chain) === 'unavaliable') {
      toastTopMessage({
        data: {
          type: 'error',
          content: 'The custom RPC is unavailable',
        },
      });
    }
  };

  return (
    <div className={styles.SwitchChainModalInner}>
      <div className={styles.title}>{title}</div>
      <RabbyInput
        autoCorrect="false"
        autoComplete="false"
        size="large"
        className={styles.search}
        prefix={<IconRcSearch className="searchIcon" />}
        value={searchInput}
        placeholder="Search chain"
        onChange={(evt) => {
          setSearchInput(evt.target.value || '');
        }}
        autoFocus
      />
      <div className={styles.scrollContainer}>
        <div>
          {pinnedChains.length > 0 && (
            <div className={styles.chainList}>
              {pinnedChains.map((chain) => {
                return (
                  <ChainItem
                    key={`chain-${chain.id}`}
                    chain={chain}
                    pinned
                    onClick={() => {
                      handleChange(chain.enum);
                    }}
                    onPinnedChange={onPinnedChange}
                    checked={value === chain.enum}
                    support={
                      supportChains ? supportChains?.includes(chain.enum) : true
                    }
                    disabledTips={disabledTips}
                    isShowCustomRPC={isShowCustomRPC}
                  />
                );
              })}
            </div>
          )}
          <div className={styles.chainList}>
            {unpinnedChains.map((chain) => {
              return (
                <ChainItem
                  key={`chain-${chain.id}`}
                  chain={chain}
                  pinned={false}
                  onClick={() => {
                    handleChange(chain.enum);
                  }}
                  onPinnedChange={onPinnedChange}
                  checked={value === chain.enum}
                  support={
                    supportChains ? supportChains?.includes(chain.enum) : true
                  }
                  disabledTips={disabledTips}
                  isShowCustomRPC={isShowCustomRPC}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SwitchChainModal() {
  const { svVisible, svState, setSvState, closeSubview } =
    useZPopupViewState('switch-chain');

  const onChainChange = (v: CHAINS_ENUM) => {
    if (v) {
      setSvState({ value: v, isCancel: false });
      closeSubview();
    }
  };

  if (!svState) return null;

  return (
    <RModal
      open={svVisible}
      centered
      className={styles.SwitchChainModal}
      mask
      width={488}
      onCancel={() => {
        setSvState({ isCancel: true });
        closeSubview();
      }}
    >
      <SwitchChainModalInner {...svState} onChange={onChainChange} />
    </RModal>
  );
}
