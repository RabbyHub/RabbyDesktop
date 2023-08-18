import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Empty, InputRef, Modal, Skeleton } from 'antd';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import IconRcArrowDownTriangle from '@/../assets/icons/swap/arrow-caret-down2.svg?rc';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import TokenWithChain from '@/renderer/components/TokenWithChain';
import IconRcSearch from '@/../assets/icons/swap/search.svg?rc';
import { formatUsdValue, splitNumberByStep } from '@/renderer/utils/number';
import { useAsync, useDebounce } from 'react-use';
import { walletController, walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import IconClose from '@/../assets/icons/swap/modal-close.svg?rc';
import RabbyInput from '@/renderer/components/AntdOverwrite/Input';
import { getChain, getTokenSymbol } from '@/renderer/utils';
import { Chain, formatTokenAmount } from '@debank/common';
import { isNil } from 'lodash';
import clsx from 'clsx';
import { findChainByServerID } from '@/renderer/utils/chain';

const TokenWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 4px;
  border-radius: 4px;
  &:hover {
    & > .text {
      color: #8697ff;
    }

    & > .arrow-icon {
      path {
        fill: #8697ff;
        stroke: #8697ff;
      }
    }
  }

  & > .text {
    margin: 0 10px;
    font-weight: 500;
    font-size: 24px;
    line-height: 23px;
    color: white;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  & > .arrow-icon {
    width: 10px;
    height: 8px;
  }
`;

const SelectTips = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 172px;
  height: 48px;
  color: #fff;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  font-weight: 500;
  font-size: 24px;
  & svg {
    position: relative;
    top: 2px;
    width: 10px;
    height: 12px;
    margin-left: 4px;
    filter: brightness(1000);
  }
`;

const Wrapper = styled.div`
  background-color: transparent;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  height: 72px;

  & > .inlinePrizeBox {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    overflow: hidden;

    & .ant-input {
      background-color: transparent !important;
      border-color: transparent;
      color: white;
      flex: 1;
      font-weight: 500;
      font-size: 24px;
      line-height: 29px;
      padding: 0;
      max-width: 100%;

      text-align: right;
      padding-right: 0;
      overflow: hidden;
      &:focus {
        border-color: transparent;
        box-shadow: none;
      }

      &:placeholder {
        color: #a9aaae;
      }
    }

    .inlinePrize {
      max-width: 100%;
      font-weight: 400;
      font-size: 12px;
      line-height: 14px;
      text-align: right;

      color: #ffffff;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      opacity: 0.6;
    }
  }
`;

const TitleWrapper = styled.div`
  .title {
    font-weight: 500;
    font-size: 22px;
    line-height: 24px;
    text-align: center;
    color: #ffffff;
  }
  .back {
    position: absolute;
    left: 13px;
    top: 27px;
    width: 6px !important;
    height: 12px !important;
    cursor: pointer;
  }
  .closeIcon {
    position: absolute;
    right: 22px;
    top: 30px;
    cursor: pointer;
    width: 24px !important;
    height: 25px !important;
  }
`;

const StyledModal = styled(Modal)`
  .ant-modal-content {
    background: var(--theme-modal-content-bg);
    box-shadow: var(--theme-modal-content-shadow);
    border-radius: 12px;
  }
  .ant-modal-body {
    height: 700px;
    padding: 0 28px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding-top: 30px;
  }
  .container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  .searchIcon {
    font-size: 16px;
  }

  .ant-input-affix-wrapper {
    margin-top: 20px;
    margin-bottom: 20px;
    height: 40px;
    font-size: 13px;
    line-height: 17px;
    box-shadow: none;
    color: var(--color-purewhite);
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.21);
    border-radius: 6px;

    &.ant-input-affix-wrapper-focused {
      border: 1px solid var(--color-primary);
    }

    & input::placeholder {
      color: #d9d9d9;
    }
  }

  .filters-wrapper {
    /* height: 28px; */
    padding-left: 0;
    padding-right: 0;
    padding-bottom: 20px;

    .filter-item__chain {
      height: 28px;
      cursor: default;
      display: inline-flex;
      padding: 6px;
      justify-content: center;
      align-items: center;

      border-radius: 4px;
      background: var(--neutral-card-2, rgba(255, 255, 255, 0.06));
    }

    img.filter-item__chain-logo {
      width: 14px;
      height: 14px;
    }

    .filter-item__chain-close {
      cursor: pointer;
    }
  }

  .listHeader {
    display: flex;
    justify-content: space-between;
    font-weight: 400;
    font-size: 12px;
    line-height: 16px;
    color: rgba(255, 255, 255, 0.8);
    margin: 0 -28px;
    padding: 0 28px 8px;
    border-bottom: 1px solid transparent;
    .left {
      text-align: left;
    }
    .right {
      color: rgba(255, 255, 255, 0.6);
      &:last-child {
        text-align: right;
      }
    }
  }

  .listBox {
    flex: 1;
    overflow-x: hidden;
    overflow-y: overlay;
    margin: 0 -28px;
    padding: 2px 28px;
  }

  .item {
    height: 52px;
    padding: 0 10px;
    margin: 0 -10px;

    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid transparent;
    cursor: pointer;
    &:hover {
      background: linear-gradient(90.98deg, #5e626b 1.39%, #656978 97.51%)
          padding-box,
        linear-gradient(90.64deg, #777d8e 1.38%, #677086 98.82%) border-box;
      box-shadow: 0px 6px 16px rgba(0, 0, 0, 0.07);
      border-radius: 8px;
    }
  }

  .grid3 {
    display: grid;
    grid-template-columns: 200px 1fr 160px;
    grid-column-gap: 10px;
  }

  .left {
    display: flex;
    align-items: center;

    .tokenInfo {
      margin-left: 12px;
      display: flex;
      flex-direction: column;

      .symbol {
        font-weight: 500;
        font-size: 13px;
        line-height: 16px;
        color: #ffffff;
      }

      .rate {
        font-weight: 400;
        font-size: 12px;
        line-height: 14px;

        color: #898989;
      }
    }
  }

  .balance,
  .usd {
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }

  .balance {
    font-size: 13px;
    line-height: 16px;
    text-align: right;
    color: #ffffff;
  }

  .usd {
    font-weight: 400;
    font-size: 12px;
    line-height: 14px;
    text-align: right;
    color: rgba(255, 255, 255, 0.8);
  }

  .noResult {
    font-weight: 400;
    font-size: 13px;
    line-height: 18px;
    text-align: center;
    color: rgba(255, 255, 255, 0.6);
    margin: 0 auto;
    margin-top: 20px;
  }
`;

const SwapLoadingWrapper = styled.div`
  margin-top: 12px;
  margin-bottom: 20px;

  .left {
    display: flex;
    justify-content: space-between;
    margin-bottom: 2px;
  }
  .right {
    display: flex;
    justify-content: space-between;
  }
  .left,
  .right {
    overflow: hidden;
  }
`;

const Loading = () => (
  <SwapLoadingWrapper>
    <div className="flex items-center justify-between">
      <Skeleton.Input
        active
        className="w-[100px]"
        style={{
          height: 24,
        }}
      />
      <Skeleton.Input
        active
        className="w-[100px]"
        style={{
          height: 24,
        }}
      />
      <Skeleton.Input
        active
        className="w-[100px]"
        style={{
          height: 24,
        }}
      />
    </div>
  </SwapLoadingWrapper>
);

export interface SearchCallbackCtx {
  chainServerId: Chain['serverId'] | null;
  chainItem: Chain | null;
}
interface TokenDrawerProps {
  title?: React.ReactNode;
  list: TokenItem[];
  open?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  onClose: () => void;
  onSearch: (
    ctx: SearchCallbackCtx & {
      keyword: string;
    }
  ) => void;
  onRemoveChainFilter?: (ctx: SearchCallbackCtx) => void;
  onConfirm(item: TokenItem): void;
  chainServerId: string | null;
}

const DefaultToken = ({
  t,
  onConfirm,
}: {
  t: TokenItem;
  onConfirm: (t: TokenItem) => void;
}) => {
  const usdValueText = formatUsdValue(
    new BigNumber(t.price || 0).times(t.amount).toFixed()
  );

  return (
    <div className="item grid3" onClick={() => onConfirm(t)}>
      <div className="left">
        <TokenWithChain width="24px" height="24px" token={t} />
        <div className="tokenInfo flex flex-col gap-4">
          <span
            className="symbol text-13 text-[var(--neutral-title-1)] font-medium"
            title={t.amount.toString()}
          >
            {formatTokenAmount(t.amount)}
          </span>
          <div className="symbol text-12 text-[var(--neutral-body)]">
            {getTokenSymbol(t)}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div
          title={splitNumberByStep(new BigNumber(t.price || 0).toFixed(2))}
          className="usd text-12 text-left"
        >
          ${splitNumberByStep(new BigNumber(t.price || 0).toFixed(2))}
        </div>
        <div>
          {isNil(t.price_24h_change) ? null : (
            <div
              className={clsx('font-normal', {
                'text-green': t.price_24h_change > 0,
                'text-red-forbidden': t.price_24h_change < 0,
              })}
            >
              {t.price_24h_change > 0 ? '+' : ''}
              {(t.price_24h_change * 100).toFixed(2)}%
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="balance text-13" title={usdValueText}>
          {usdValueText}
        </div>
      </div>
    </div>
  );
};

const TokenSelectModal = ({
  title = 'Select a token',
  open = false,
  list,
  onConfirm,
  isLoading = false,
  onSearch,
  onRemoveChainFilter,
  onClose,
  placeholder = 'Search by Name / Address',
  chainServerId,
}: TokenDrawerProps) => {
  const [query, setQuery] = useState('');
  const handleQueryChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setQuery(e.target.value);
  };

  const isEmpty = list.length <= 0;

  const { chainItem, chainSearchCtx } = useMemo(() => {
    const chain = !chainServerId ? null : findChainByServerID(chainServerId);
    return {
      chainItem: chain,
      chainSearchCtx: {
        chainServerId,
        chainItem: chain,
      },
    };
  }, [chainServerId]);

  useDebounce(
    () => {
      onSearch({ ...chainSearchCtx, keyword: query });
    },
    150,
    [query]
  );

  const isAddr = useMemo(() => {
    const kw = query.trim();
    return kw.length === 42 && kw.toLowerCase().startsWith('0x');
  }, [query]);

  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  return (
    <StyledModal
      centered
      onCancel={onClose}
      width={536}
      open={open}
      destroyOnClose
      closable={false}
      title={null}
      footer={null}
    >
      <div className="container">
        <TitleWrapper>
          <div className="title">{title}</div>
          <IconClose className="closeIcon" onClick={onClose} />
        </TitleWrapper>

        <RabbyInput
          prefix={<IconRcSearch className="searchIcon" />}
          value={query}
          placeholder={placeholder}
          size="large"
          onChange={handleQueryChange}
        />

        {chainItem && (
          <div className="filters-wrapper">
            <div className="filter-item__chain">
              <img
                className="filter-item__chain-logo"
                src={chainItem.logo}
                alt={chainItem.name}
              />
              <span className="text-13 text-[var(--neutral-body)] ml-[4px]">
                {chainItem.name}
              </span>
              <div
                className="py-4 cursor-pointer"
                onClick={() => {
                  onRemoveChainFilter?.({ chainServerId, chainItem });
                  onSearch({
                    chainItem: null,
                    chainServerId: '',
                    keyword: query,
                  });
                }}
              >
                <img
                  className="filter-item__chain-close w-[12px] h-[12px] ml-[6px]"
                  src="rabby-internal://assets/icons/chain-select/chain-filter-close.svg"
                />
              </div>
            </div>
          </div>
        )}

        <div className="listHeader grid3">
          <div className="right">ASSET / AMOUNT</div>
          <div className="right">PRICE</div>
          <div className="right">USD VALUE</div>
        </div>

        <div className="listBox">
          {!isLoading && isEmpty && (
            <Empty
              image="rabby-internal://assets/icons/swap/no-result.svg"
              imageStyle={{
                width: 60,
                height: 52,
                margin: '150px auto 0 auto',
              }}
              description={
                <div className="noResult">
                  No Match
                  <br />
                  {!isAddr && (
                    <>
                      Try to search contract address on{' '}
                      {!chainServerId
                        ? ''
                        : findChainByServerID(chainServerId)?.name || 'chain'}
                    </>
                  )}
                </div>
              }
            />
          )}
          {isLoading && (
            <div>
              {Array(8)
                .fill(1)
                .map((_, idx) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <Loading key={`loading-${idx}`} />
                ))}
            </div>
          )}
          {!isLoading &&
            !isEmpty &&
            list.map((t) => (
              <DefaultToken t={t} onConfirm={onConfirm} key={t.id} />
            ))}
        </div>
      </div>
    </StyledModal>
  );
};

export interface TokenAmountInputProps {
  token?: TokenItem;
  onChange?(amount: string): void;
  onTokenChange(token: TokenItem): void;
  chainId: string | null;
  excludeTokens?: TokenItem['id'][];
  type?: 'default' | 'swapTo' | 'swapFrom';
  placeholder?: string;
  hideChainIcon?: boolean;
  value?: string;
  loading?: boolean;
  forceFocus?: boolean;
  inlinePrize?: boolean;
  className?: string;
  logoSize?: number;
  tokenRender?:
    | (({
        token,
        openTokenModal,
      }: {
        token?: TokenItem;
        openTokenModal: () => void;
      }) => React.ReactNode)
    | React.ReactNode;
}

const sortTokensByPrice = (t: TokenItem[]) => {
  return [...t].sort((a, b) => {
    return new BigNumber(b.amount)
      .times(new BigNumber(b.price || 0))
      .minus(new BigNumber(a.amount).times(new BigNumber(a.price || 0)))
      .toNumber();
  });
};

export const TokenSelect = ({
  token,
  onChange,
  onTokenChange,
  chainId: externalChainId,
  excludeTokens = [],
  type = 'default',
  placeholder,
  hideChainIcon = true,
  value,
  loading = false,
  forceFocus = false,
  inlinePrize = false,
  className,
  logoSize = 28,
  tokenRender,
}: TokenAmountInputProps) => {
  const inputRef = useRef<InputRef>(null);

  const [queryConds, setQueryConds] = useState({
    keyword: '',
    chainServerId: externalChainId,
  });

  const [open, setOpen] = useState(false);

  const { currentAccount } = useCurrentAccount();

  const isSwapType = useMemo(
    () => ['swapFrom', 'swapTo'].includes(type),
    [type]
  );

  const handleCurrentTokenChange = (t: TokenItem) => {
    onChange?.('');
    onTokenChange(t);
    setOpen(false);

    setQueryConds((prev) => ({ ...prev, chainServerId: t.chain }));
  };

  const handleTokenSelectorClose = () => {
    setOpen(false);

    setQueryConds((prev) => ({
      ...prev,
      chainServerId: externalChainId,
    }));
  };

  const handleSelectToken = () => {
    setOpen(true);
  };

  const { value: originTokenList = [], loading: isTokenLoading } =
    useAsync(async () => {
      if (!open || !currentAccount?.address) return [];
      let tokens: TokenItem[] = [];

      const getDefaultTokens = isSwapType
        ? walletOpenapi.getSwapTokenList
        : walletOpenapi.listToken;

      const currentAddress = currentAccount?.address || '';
      const defaultTokens = await getDefaultTokens(
        currentAddress,
        queryConds.chainServerId || undefined
      );
      let localAddedTokens: TokenItem[] = [];

      if (!isSwapType) {
        const localAdded =
          (await walletController.getAddedToken(currentAddress)).filter(
            (item) => {
              const [chain] = item.split(':');
              return chain === queryConds.chainServerId;
            }
          ) || [];
        if (localAdded.length > 0) {
          localAddedTokens = await walletOpenapi.customListToken(
            localAdded,
            currentAddress
          );
        }
      }
      tokens = sortTokensByPrice([
        ...defaultTokens,
        ...localAddedTokens,
      ]).filter((e) => (type === 'swapFrom' ? e.amount > 0 : true));

      return tokens;
    }, [open, queryConds.chainServerId, isSwapType, currentAccount?.address]);

  const { value: displayTokens = [], loading: isSearchLoading } =
    useAsync(async (): Promise<TokenItem[]> => {
      if (!open || !currentAccount?.address) return [];
      if (!queryConds.keyword) {
        return originTokenList;
      }

      const kw = queryConds.keyword.trim();

      if (kw.length === 42 && kw.toLowerCase().startsWith('0x')) {
        const data = await walletOpenapi.searchToken(
          currentAccount.address,
          queryConds.keyword
        );
        return data.filter((e) => e.chain === queryConds.chainServerId);
      }
      if (isSwapType) {
        const data = await walletOpenapi.searchSwapToken(
          currentAccount.address,
          queryConds.chainServerId || 'eth',
          queryConds.keyword
        );
        return data;
      }

      return originTokenList.filter((t) => {
        const reg = new RegExp(kw, 'i');
        return reg.test(t.name) || reg.test(t.symbol);
      });
    }, [
      open,
      originTokenList,
      queryConds.keyword,
      queryConds.chainServerId,
      currentAccount?.address,
    ]);

  const isListLoading = isTokenLoading || isSearchLoading;

  const handleSearchTokens = React.useCallback(
    async (
      ctx: SearchCallbackCtx & {
        keyword: string;
      }
    ) => {
      setQueryConds({
        keyword: ctx.keyword,
        chainServerId: ctx.chainServerId,
      });
    },
    []
  );

  const availableToken = useMemo(
    () => displayTokens.filter((e) => !excludeTokens.includes(e.id)),
    [excludeTokens, displayTokens]
  );

  const [input, setInput] = useState('');

  const handleInput: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const v = e.target.value;
    if (!/^\d*(\.\d*)?$/.test(v)) {
      return;
    }
    setInput(v);
    onChange?.(v);
  };

  useEffect(() => {
    setQueryConds((prev) => ({
      ...prev,
      chainServerId: externalChainId,
    }));
  }, [externalChainId]);

  useEffect(() => {
    if (forceFocus) {
      inputRef.current?.focus();
    }
  }, [forceFocus]);

  if (tokenRender) {
    return (
      <>
        {typeof tokenRender === 'function'
          ? tokenRender?.({ token, openTokenModal: handleSelectToken })
          : tokenRender}
        <TokenSelectModal
          open={open}
          placeholder={placeholder}
          list={availableToken}
          onClose={handleTokenSelectorClose}
          onSearch={handleSearchTokens}
          onConfirm={handleCurrentTokenChange}
          isLoading={isListLoading}
          chainServerId={queryConds.chainServerId}
        />
      </>
    );
  }

  return (
    <>
      <Wrapper className={className}>
        <div onClick={handleSelectToken}>
          {token ? (
            <TokenWrapper>
              <TokenWithChain
                width={`${logoSize}px`}
                height={`${logoSize}px`}
                token={token}
                hideConer
                hideChainIcon={hideChainIcon}
              />
              <span className="text" title={getTokenSymbol(token)}>
                {getTokenSymbol(token)}
              </span>
              <IconRcArrowDownTriangle className="arrow-icon " />
            </TokenWrapper>
          ) : (
            <SelectTips>
              <span>Select Token</span>
              <IconRcArrowDownTriangle className="ml-[10px]" />
            </SelectTips>
          )}
        </div>
        {loading ? (
          <div
            style={{
              width: 110,
              height: 26,
              overflow: 'hidden',
            }}
          >
            <Skeleton.Input
              active
              style={{
                height: 26,
              }}
            />
          </div>
        ) : (
          <div className="inlinePrizeBox">
            <RabbyInput
              ref={inputRef}
              className="amountInput"
              readOnly={type === 'swapTo'}
              placeholder="0"
              autoFocus={forceFocus}
              autoCorrect="false"
              autoComplete="false"
              value={value ?? input}
              onChange={type !== 'swapTo' ? handleInput : undefined}
            />
            {inlinePrize && token && (
              <div
                className="inlinePrize"
                title={splitNumberByStep(
                  ((Number(value) || 0) * token.price || 0).toFixed(2)
                )}
              >
                {Number(value)
                  ? `≈$${splitNumberByStep(
                      ((Number(value) || 0) * token.price || 0).toFixed(2)
                    )}`
                  : ''}
              </div>
            )}
          </div>
        )}
        <TokenSelectModal
          open={open}
          placeholder={placeholder}
          list={availableToken}
          onClose={handleTokenSelectorClose}
          onSearch={handleSearchTokens}
          onConfirm={handleCurrentTokenChange}
          isLoading={isListLoading}
          chainServerId={queryConds.chainServerId}
        />
      </Wrapper>
    </>
  );
};

export default TokenSelect;
