import { Input } from 'antd';
import { useCallback, useRef } from 'react';
import clsx from 'clsx';
import { useScroll } from 'react-use';

import { Modal as RModal } from '@/renderer/components/Modal/Modal';
import { useCurrentConnection } from '@/renderer/hooks/rabbyx/useConnection';
import {
  useZPopupLayerOnMain,
  useZPopupViewState,
} from '@/renderer/hooks/usePopupWinOnMainwin';
import { useBodyClassNameOnMounted } from '@/renderer/hooks/useMountedEffect';
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
}: {
  chain: import('@debank/common').Chain;
  pinned: boolean;
  checked: boolean;
  onClick?: React.DOMAttributes<HTMLDivElement>['onClick'];
  onPinnedChange?: OnPinnedChanged;
}) {
  return (
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
  );
}

function SwitchChainModalInner({
  dappTabInfo: tab,
}: {
  dappTabInfo: ZViewStates['switch-chain']['dappTabInfo'];
}) {
  useBodyClassNameOnMounted('switch-chain-subview');
  const scrollRef = useRef(null);
  const { y } = useScroll(scrollRef);

  const zActions = useZPopupLayerOnMain();

  const {
    pinnedChains,
    unpinnedChains,

    setChainPinned,
    switchChain,

    searchInput,
    setSearchInput,
    searchedPinned,
    searchedUnpinned,
    searchedChains,
    currentSite,
  } = useCurrentConnection(tab);

  const onPinnedChange: OnPinnedChanged = useCallback(
    (chain, nextPinned) => {
      setChainPinned(chain, nextPinned);
    },
    [setChainPinned]
  );

  return (
    <div className={styles.SwitchChainModalInner} ref={scrollRef}>
      <div
        className={clsx(styles.inputWrapper, {
          [styles.show]: y > 40 || searchedChains.length > 0,
        })}
      >
        <Input
          value={searchInput}
          placeholder="Search chain"
          size="large"
          className={styles.searchChainInput}
          onChange={(evt) => {
            setSearchInput(evt.target.value || '');
          }}
        />
      </div>
      {searchedChains.length > 0 ? (
        <div className={`${styles.chainList} ${styles.searchChainList}`}>
          {searchedPinned.map((chain) => {
            return (
              <ChainItem
                key={`searched-chain-${chain.id}`}
                chain={chain}
                pinned
                checked={currentSite?.chain === chain.enum}
                onClick={async () => {
                  await switchChain(chain.enum);
                  zActions.hideZSubview('switch-chain');
                }}
                onPinnedChange={onPinnedChange}
              />
            );
          })}
          {searchedUnpinned.map((chain) => {
            return (
              <ChainItem
                key={`searched-chain-${chain.id}`}
                chain={chain}
                pinned={false}
                onClick={async () => {
                  await switchChain(chain.enum);
                  zActions.hideZSubview('switch-chain');
                }}
                onPinnedChange={onPinnedChange}
                checked={currentSite?.chain === chain.enum}
              />
            );
          })}
        </div>
      ) : (
        <>
          {pinnedChains.length > 0 && (
            <div className={styles.chainList}>
              {pinnedChains.map((chain) => {
                return (
                  <ChainItem
                    key={`chain-${chain.id}`}
                    chain={chain}
                    pinned
                    onClick={async () => {
                      await switchChain(chain.enum);
                      zActions.hideZSubview('switch-chain');
                    }}
                    onPinnedChange={onPinnedChange}
                    checked={currentSite?.chain === chain.enum}
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
                    await switchChain(chain.enum);
                    zActions.hideZSubview('switch-chain');
                  }}
                  onPinnedChange={onPinnedChange}
                  checked={currentSite?.chain === chain.enum}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function SwitchChainModal() {
  const { svVisible, svState, closeSubview } =
    useZPopupViewState('switch-chain');

  if (!svState?.dappTabInfo) return null;

  return (
    <RModal
      open={svVisible}
      centered
      className={styles.SwitchChainModal}
      mask
      width={604}
      title="Select the Chain"
      onCancel={() => {
        closeSubview();
      }}
    >
      <SwitchChainModalInner dappTabInfo={svState.dappTabInfo} />
    </RModal>
  );
}
