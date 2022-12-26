import { useCurrentConnection } from '@/renderer/hooks/rabbyx/useConnection';
import { usePopupWinInfo } from '@/renderer/hooks/usePopupWinOnMainwin';
import { useBodyClassNameOnMounted } from '@/renderer/hooks/useMountedEffect';
import { Input } from 'antd';
import { useCallback } from 'react';
import clsx from 'clsx';
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

function SwitchChainPage({
  pageInfo,
}: {
  pageInfo: IContextMenuPageInfo & { type: 'switch-chain' };
}) {
  useBodyClassNameOnMounted('switch-chain-page');

  const tab = pageInfo.dappTabInfo;
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
    <div className={styles.SwitchChainPage}>
      <Input
        value={searchInput}
        placeholder="Search chain"
        size="large"
        className={styles.searchChainInput}
        onChange={(evt) => {
          setSearchInput(evt.target.value || '');
        }}
      />
      {searchedChains.length > 0 ? (
        <div className={styles.chainList}>
          {searchedPinned.map((chain) => {
            return (
              <ChainItem
                key={`searched-chain-${chain.id}`}
                chain={chain}
                pinned
                checked={currentSite?.chain === chain.enum}
                onClick={() => {
                  switchChain(chain.enum);
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
                onClick={() => {
                  switchChain(chain.enum);
                }}
                onPinnedChange={onPinnedChange}
                checked={currentSite?.chain === chain.enum}
              />
            );
          })}
        </div>
      ) : (
        <>
          <div className={styles.chainList}>
            {pinnedChains.map((chain) => {
              return (
                <ChainItem
                  key={`chain-${chain.id}`}
                  chain={chain}
                  pinned
                  onClick={() => {
                    switchChain(chain.enum);
                  }}
                  onPinnedChange={onPinnedChange}
                  checked={currentSite?.chain === chain.enum}
                />
              );
            })}
          </div>
          <div className={styles.chainList}>
            {unpinnedChains.map((chain) => {
              return (
                <ChainItem
                  key={`chain-${chain.id}`}
                  chain={chain}
                  pinned={false}
                  onClick={() => {
                    switchChain(chain.enum);
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

export default function SwitchChainWindow() {
  const pageInfo = usePopupWinInfo('switch-chain');

  if (!pageInfo?.dappTabInfo?.url) return null;

  return <SwitchChainPage pageInfo={pageInfo} />;
}
