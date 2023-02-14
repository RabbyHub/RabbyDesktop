import { Input, Tooltip } from 'antd';
import { useCallback, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';

import { Modal as RModal } from '@/renderer/components/Modal/Modal';
import {
  useZPopupLayerOnMain,
  useZPopupViewState,
} from '@/renderer/hooks/usePopupWinOnMainwin';
import { useBodyClassNameOnMounted } from '@/renderer/hooks/useMountedEffect';
import IconRcSearch from '@/../assets/icons/swap/search.svg?rc';
import { usePreference } from '@/renderer/hooks/rabbyx/usePreference';
import { Chain, CHAINS_ENUM, CHAINS_LIST } from '@debank/common';
import { useClickOutSide } from '@/renderer/hooks/useClick';
import { useMessageForwarded } from '@/renderer/hooks/useViewsMessage';
import styles from './index.module.less';

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
}: {
  chain: import('@debank/common').Chain;
  pinned: boolean;
  checked: boolean;
  onClick?: React.DOMAttributes<HTMLDivElement>['onClick'];
  onPinnedChange?: OnPinnedChanged;
  support?: boolean;
  disabledTips?: React.ReactNode;
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
      <div className={styles.chainItem} onClick={onClick}>
        <div className={styles.chainItemLeft}>
          <img src={chain.logo} className={styles.chainItemIcon} />
          <div className={styles.chainItemName}>{chain.name}</div>
        </div>
        <img
          className={clsx(styles.chainItemStar, pinned ? styles.block : '')}
          src={
            pinned
              ? 'rabby-internal://assets/icons/select-chain/icon-pinned-fill.svg'
              : 'rabby-internal://assets/icons/select-chain/icon-pinned.svg'
          }
          onClick={(evt) => {
            evt.stopPropagation();
            onPinnedChange?.(chain.enum, !pinned);
          }}
          alt=""
        />
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
  title = 'Select the chain',
  supportChains,
  disabledTips,
}: {
  value?: CHAINS_ENUM;
  onChange: (v: CHAINS_ENUM) => void;
  title?: string;
  supportChains?: CHAINS_ENUM[];
  disabledTips?: React.ReactNode;
}) {
  useBodyClassNameOnMounted('switch-chain-subview');

  const zActions = useZPopupLayerOnMain();

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
        unpinnedChains: unpinned.sort(sortFn),
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

  return (
    <div className={styles.SwitchChainModalInner}>
      <div className={styles.title}>{title}</div>
      <Input
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
                    onClick={async () => {
                      await onChange(chain.enum);
                      // zActions.hideZSubview('switch-chain');
                    }}
                    onPinnedChange={onPinnedChange}
                    checked={value === chain.enum}
                    support={
                      supportChains ? supportChains?.includes(chain.enum) : true
                    }
                    disabledTips={disabledTips}
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
                  onClick={async () => {
                    await onChange(chain.enum);
                    // zActions.hideZSubview('switch-chain');
                  }}
                  onPinnedChange={onPinnedChange}
                  checked={value === chain.enum}
                  support={
                    supportChains ? supportChains?.includes(chain.enum) : true
                  }
                  disabledTips={disabledTips}
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
  const { svVisible, svState, closeSubview } =
    useZPopupViewState('switch-chain');

  console.log({ svState });

  const ZActions = useZPopupLayer();

  const onChainChange = useCallback(
    (v: CHAINS_ENUM) => {
      // throw new Error('Function not implemented.');
      if (v) {
        ZActions.showZSubview('switch-chain', { value: v });
      }
    },
    [ZActions]
  );

  if (!svState) return null;

  return (
    <RModal
      open={svVisible}
      centered
      className={styles.SwitchChainModal}
      mask
      width={488}
      onCancel={() => {
        closeSubview();
      }}
    >
      <SwitchChainModalInner {...svState} onChange={onChainChange} />
    </RModal>
  );
}

export const useSwitchChainModal = <T extends HTMLElement>(
  cb?: (c: CHAINS_ENUM) => void,
  clickOutSide = true
) => {
  const ref = useRef<T>(null);
  const ZActions = useZPopupLayer();
  // const { svState } = useZPopupViewState('switch-chain');

  useClickOutSide(ref, () => {
    if (clickOutSide) {
      ZActions.hideZSubview('switch-chain');
    }
  });

  // useMessageForwarded(
  //   {
  //     type: 'update-subview-state',
  //     targetView: 'main-window',
  //   },
  //   (payload) => {
  //     const { partials } = payload;
  //     // @ts-expect-error
  //     const chain = partials?.['switch-chain']?.state?.value;
  //     if (chain) {
  //       cb?.(chain);
  //     }
  //     // if (!partials) return;

  //     // setSvStates((prev) => ({
  //     //   ...prev,
  //     //   ...partials,
  //     // }));
  //   }
  // );

  return useMemo(
    () => ({
      ref,
      open: (svPartials?: {
        value?: CHAINS_ENUM | undefined;
        title?: string | undefined;
        supportChains?: CHAINS_ENUM[] | undefined;
        disabledTips?: string | undefined;
      }) =>
        ZActions.showZSubview('switch-chain', {
          value: CHAINS_ENUM.ETH,
          ...svPartials,
        }),
    }),
    [ZActions]
  );
};
