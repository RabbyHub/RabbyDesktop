import { useCurrentConnection } from '@/renderer/hooks/rabbyx/useConnection';
import { useContextMenuPageInfo } from '@/renderer/hooks/useContextMenuPage';
import { useBodyClassNameOnMounted } from '@/renderer/hooks/useMountedEffect';
import { Divider, Input } from 'antd';
import { useCallback } from 'react';
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
}: {
  chain: import('@debank/common').Chain;
  pinned: boolean;
  onClick?: React.DOMAttributes<HTMLDivElement>['onClick'];
  onPinnedChange?: OnPinnedChanged;
}) {
  return (
    <div className={styles.chainItem} onClick={onClick}>
      {chain.name}
      <span
        className={styles.actionPin}
        onClick={(evt) => {
          evt.stopPropagation();
          onPinnedChange?.(chain.enum, !pinned);
        }}
      >
        {!pinned ? 'Pin' : '⭐'}
      </span>
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
        placeholder="input search keyword"
        onChange={(evt) => {
          setSearchInput(evt.target.value || '');
        }}
      />
      <Divider />
      {searchedChains.length > 0 ? (
        <>
          <h3>Summary</h3>
          <pre>searchedPinned.length: {searchedPinned.length}</pre>
          <pre>searchedUnpinned.length: {searchedUnpinned.length}</pre>
          <pre>searchedChains.length: {searchedChains.length}</pre>
          <Divider />
          {searchedPinned.map((chain) => {
            return (
              <ChainItem
                key={`searched-chain-${chain.id}`}
                chain={chain}
                pinned
                onClick={() => {
                  switchChain(chain.enum);
                }}
                onPinnedChange={onPinnedChange}
              />
            );
          })}
          {searchedUnpinned.length ? <Divider /> : null}
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
              />
            );
          })}
        </>
      ) : (
        <>
          <h3>Summary</h3>
          <pre>pinnedChains.length: {pinnedChains.length}</pre>
          <pre>unpinnedChains.length: {unpinnedChains.length}</pre>
          <Divider />
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
              />
            );
          })}
          {unpinnedChains.length ? <Divider /> : null}
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
              />
            );
          })}
        </>
      )}
    </div>
  );
}

export default function SwitchChainWindow() {
  const pageInfo = useContextMenuPageInfo('switch-chain');

  if (!pageInfo?.dappTabInfo?.url) return null;

  return <SwitchChainPage pageInfo={pageInfo} />;
}
