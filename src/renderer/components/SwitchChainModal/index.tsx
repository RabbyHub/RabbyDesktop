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
import { useAccountBalanceMap } from '@/renderer/hooks/rabbyx/useAccount';
import { varyAndSortChainItems } from '@/isomorphic/wallet/chain';
import { formatUsdValue } from '@/renderer/utils/number';
import styles from './index.module.less';
import RabbyInput from '../AntdOverwrite/Input';
import { TipsWrapper } from '../TipWrapper';
import ChainIcon from '../ChainIcon';

import SvgIconWallet from './icons/chain-wallet.svg?rc';

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
  balanceValue,
}: {
  chain: import('@debank/common').Chain;
  pinned: boolean;
  checked: boolean;
  onClick?: React.DOMAttributes<HTMLDivElement>['onClick'];
  onPinnedChange?: OnPinnedChanged;
  support?: boolean;
  disabledTips?: React.ReactNode;
  isShowCustomRPC?: boolean;
  balanceValue?: number;
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
          <div className={styles.nameWrapper}>
            <div className={styles.chainNameFloor}>
              <div className={styles.chainItemName}>{chain.name}</div>
            </div>
            {!!balanceValue && (
              <div
                className={clsx(styles.chainNameFloor, styles.chainBalanceInfo)}
              >
                <SvgIconWallet />
                <span className="ml-6">{formatUsdValue(balanceValue)}</span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.chainItemRight}>
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
              className={clsx(styles.chainItemChecked, 'ml-16')}
              src="rabby-internal://assets/icons/select-chain/checked.svg"
            />
          )}
        </div>
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
  isCheckCustomRPC,
}: {
  value?: CHAINS_ENUM;
  onChange: (v: CHAINS_ENUM) => void;
  title?: string;
  supportChains?: CHAINS_ENUM[];
  disabledTips?: React.ReactNode;
  isShowCustomRPC?: boolean;
  isCheckCustomRPC?: boolean;
}) {
  useBodyClassNameOnMounted('switch-chain-subview');

  const { preferences, setChainPinned } = usePreference();

  const { matteredChainBalances, getLocalBalanceValue } =
    useAccountBalanceMap();

  const [searchInput, setSearchInput] = useState('');

  const { pinnedSet, matteredList, unmatteredList } = useMemo(() => {
    const set = new Set(preferences.pinnedChain);
    return {
      ...varyAndSortChainItems({
        supportChains,
        pinned: [...set],
        matteredChainBalances,
      }),
      pinnedSet: set,
    };
  }, [preferences.pinnedChain, supportChains, matteredChainBalances]);

  const onPinnedChange: OnPinnedChanged = useCallback(
    (chain, nextPinned) => {
      setChainPinned(chain, nextPinned);
    },
    [setChainPinned]
  );

  const { getAllRPC, pingCustomRPC } = useCustomRPC();

  useEffect(() => {
    if (isShowCustomRPC || isCheckCustomRPC) {
      getAllRPC();
    }
  }, [getAllRPC, isCheckCustomRPC, isShowCustomRPC]);

  const handleChange = async (chain: CHAINS_ENUM) => {
    onChange?.(chain);
    if (
      (isShowCustomRPC || isCheckCustomRPC) &&
      !(await pingCustomRPC(chain))
    ) {
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
          {matteredList.length > 0 && (
            <div className={styles.chainList}>
              {matteredList.map((chain) => {
                return (
                  <ChainItem
                    key={`chain-${chain.id}`}
                    chain={chain}
                    pinned={pinnedSet.has(chain.enum)}
                    balanceValue={getLocalBalanceValue(chain.serverId)}
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
            {unmatteredList.map((chain) => {
              return (
                <ChainItem
                  key={`chain-${chain.id}`}
                  chain={chain}
                  pinned={pinnedSet.has(chain.enum)}
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
