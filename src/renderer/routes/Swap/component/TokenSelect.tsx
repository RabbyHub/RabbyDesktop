import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';
import { Empty, Input, InputRef, Modal, Skeleton } from 'antd';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import IconRcArrowDownTriangle from '@/../assets/icons/swap/arrow-caret-down2.svg?rc';
import { TokenItem } from '@debank/rabby-api/dist/types';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import TokenWithChain from '@/renderer/components/TokenWithChain';
import IconRcSearch from '@/../assets/icons/swap/search.svg?rc';
import { formatTokenAmount, splitNumberByStep } from '@/renderer/utils/number';
import { useDebounce } from 'react-use';
import { walletController, walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import IconClose from '@/../assets/icons/swap/modal-close.svg?rc';

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
    background-color: transparent;
  }
  .ant-modal-body {
    height: 700px;
    padding: 0 28px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding-top: 30px;
    background: #525767;
    box-shadow: 0px 24px 80px rgba(19, 20, 26, 0.18);
    border-radius: 12px;
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
    margin-top: 33px;
    margin-bottom: 0;
    height: 36px;
    font-size: 12px;
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

  .listHeader {
    display: flex;
    justify-content: space-between;
    font-weight: 400;
    font-size: 14px;
    line-height: 16px;
    color: rgba(255, 255, 255, 0.8);
    margin: 0 -28px;
    padding: 20px 28px;
    border-bottom: 1px solid #6f7585;
    .left {
      text-align: left;
    }
    .right {
      color: rgba(255, 255, 255, 0.3);
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
    height: 50px;
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
    grid-template-columns: 180px auto 200px;
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
    color: #898989;
  }

  .noResult {
    font-weight: 400;
    font-size: 18px;
    line-height: 21px;
    text-align: center;
    color: rgba(255, 255, 255, 0.4);
    margin: 0 auto;
    margin-top: 20px;
    margin-bottom: 12px;
  }
  .noResultTip {
    margin: 0 auto;

    width: 283px;
    font-weight: 400;
    font-size: 12px;
    line-height: 18px;
    text-align: center;
    color: rgba(255, 255, 255, 0.4);
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

const SwapLoading = ({ columns = 2 }) =>
  columns === 2 ? (
    <SwapLoadingWrapper>
      <div className="left ">
        <Skeleton.Input
          active
          className="w-[140px]"
          style={{
            height: 15,
          }}
        />
        <Skeleton.Input
          active
          className="w-[90px]"
          style={{
            height: 15,
          }}
        />
      </div>
      <div className="right">
        <Skeleton.Input
          active
          className="w-[60px]"
          style={{
            height: 14,
          }}
        />
        <Skeleton.Input
          active
          className="w-[60px]"
          style={{
            height: 14,
          }}
        />
      </div>
    </SwapLoadingWrapper>
  ) : (
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
interface TokenDrawerProps {
  title?: React.ReactNode;
  list: TokenItem[];
  open?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  onClose: () => void;
  onSearch: (q: string) => void;
  onConfirm(item: TokenItem): void;
  columns?: 2 | 3;
}

const SwapToken = ({
  t,
  onConfirm,
}: {
  t: TokenItem;
  onConfirm: (t: TokenItem) => void;
}) => {
  return (
    <div className="item" onClick={() => onConfirm(t)}>
      <div className="left">
        <TokenWithChain token={t} />
        <div className="tokenInfo">
          <div className="symbol">{t.symbol}</div>
          <div className="rate">
            @{splitNumberByStep((t.price || 0).toFixed(2))}
          </div>
        </div>
      </div>
      <div className="right">
        <div className="balance" title={formatTokenAmount(t.amount)}>
          {t.amount !== 0 && t.amount < 0.0001
            ? '< 0.0001'
            : formatTokenAmount(t.amount)}
        </div>
        <div
          title={splitNumberByStep(
            new BigNumber(t.price || 0).times(t.amount).toFixed(2)
          )}
          className="usd"
        >
          $
          {splitNumberByStep(
            new BigNumber(t.price || 0).times(t.amount).toFixed(2)
          )}
        </div>
      </div>
    </div>
  );
};

const DefaultToken = ({
  t,
  onConfirm,
}: {
  t: TokenItem;
  onConfirm: (t: TokenItem) => void;
}) => {
  return (
    <div className="item grid3" onClick={() => onConfirm(t)}>
      <div className="left">
        <TokenWithChain width="24px" height="24px" token={t} />
        <div className="tokenInfo">
          <div className="symbol text-15">{t.symbol}</div>
        </div>
      </div>
      <div
        title={splitNumberByStep(
          new BigNumber(t.price || 0).times(t.amount).toFixed(2)
        )}
        className="usd text-15"
      >
        {splitNumberByStep(
          new BigNumber(t.price || 0).times(t.amount).toFixed(2)
        )}
      </div>
      <div className="balance text-15" title={formatTokenAmount(t.amount)}>
        {t.amount !== 0 && t.amount < 0.0001
          ? '< 0.0001'
          : formatTokenAmount(t.amount)}
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
  onClose,
  placeholder = 'Search by Name / Address',
  columns = 2,
}: TokenDrawerProps) => {
  const [query, setQuery] = useState('');
  const handleQueryChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setQuery(e.target.value);
  };

  const isEmpty = list.length <= 0;

  useDebounce(
    () => {
      onSearch(query);
    },
    150,
    [query]
  );

  const listHeader = useMemo(() => {
    if (columns === 2) {
      return (
        <div className="listHeader">
          <div className="left">Token</div>
          <div className="right">Balance / Value</div>
        </div>
      );
    }
    return (
      <div className="listHeader grid3">
        <div className="right">Token</div>
        <div className="right">Price</div>
        <div className="right">Balance</div>
      </div>
    );
  }, [columns]);

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

        <Input
          prefix={<IconRcSearch className="searchIcon" />}
          value={query}
          placeholder={placeholder}
          size="large"
          onChange={handleQueryChange}
        />

        {listHeader}

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
                <>
                  <div className="noResult">
                    No {columns === 2 ? 'Results' : 'Tokens'}
                  </div>
                  {columns === 2 && (
                    <div className="noResultTip">
                      Only tokens listed in Rabby by default are supported for
                      swap
                    </div>
                  )}
                </>
              }
            />
          )}
          {isLoading && (
            <div>
              {Array(8)
                .fill(1)
                .map((_, idx) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <SwapLoading columns={columns} key={`loading-${idx}`} />
                ))}
            </div>
          )}
          {!isLoading &&
            !isEmpty &&
            list.map((t) =>
              columns === 2 ? (
                <SwapToken t={t} onConfirm={onConfirm} key={t.id} />
              ) : (
                <DefaultToken t={t} onConfirm={onConfirm} key={t.id} />
              )
            )}
        </div>
      </div>
    </StyledModal>
  );
};

interface TokenAmountInputProps {
  token?: TokenItem;
  onChange?(amount: string): void;
  onTokenChange(token: TokenItem): void;
  chainId: string;
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
  chainId,
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
}: TokenAmountInputProps) => {
  const inputRef = useRef<InputRef>(null);
  const latestChainId = useRef(chainId);
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [originTokenList, setOriginTokenList] = useState<TokenItem[]>([]);
  const [isListLoading, setIsListLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const { currentAccount } = useCurrentAccount();

  const handleCurrentTokenChange = (t: TokenItem) => {
    if (onChange) {
      onChange('');
    }
    onTokenChange(t);
    setOpen(false);
  };

  const handleTokenSelectorClose = () => {
    setOpen(false);
  };

  const handleLoadTokens = useCallback(async () => {
    if (type === 'default') {
      setIsListLoading(true);
      let tokenList: TokenItem[] = [];

      const currentAddress = currentAccount?.address || '';
      const defaultTokens = await walletOpenapi.listToken(
        currentAddress,
        chainId
      );
      let localAddedTokens: TokenItem[] = [];

      const localAdded =
        (await walletController.getAddedToken(currentAddress)).filter(
          (item) => {
            const [chain] = item.split(':');
            return chain === chainId;
          }
        ) || [];
      if (localAdded.length > 0) {
        localAddedTokens = await walletOpenapi.customListToken(
          localAdded,
          currentAddress
        );
      }

      if (chainId !== latestChainId.current) return;
      tokenList = sortTokensByPrice([...defaultTokens, ...localAddedTokens]);
      setOriginTokenList(tokenList);
      setTokens(tokenList);
      setIsListLoading(false);
    } else {
      setIsListLoading(true);
      let tokenList: TokenItem[] = [];

      const currentAddress = currentAccount?.address || '';
      const defaultTokens = await walletOpenapi.getSwapTokenList(
        currentAddress,
        chainId
      );

      if (chainId !== latestChainId.current) return;
      tokenList = sortTokensByPrice(defaultTokens).filter((e) =>
        type === 'swapFrom' ? e.amount > 0 : true
      );
      setOriginTokenList(tokenList);
      setTokens(tokenList);
      setIsListLoading(false);
    }
  }, [chainId, type, currentAccount?.address]);

  const handleSelectToken = () => {
    setOpen(true);
  };

  const handleSearchTokens = async (q: string) => {
    if (!q) {
      setTokens(originTokenList);
      return;
    }
    setIsListLoading(true);
    try {
      const data = await walletOpenapi.searchSwapToken(
        currentAccount!.address,
        chainId,
        q
      );
      setTokens(data);
    } catch (error) {
      console.error('swap search error :', error);
    }
    setIsListLoading(false);
  };

  const availableToken = useMemo(
    () => tokens.filter((e) => !excludeTokens.includes(e.id)),
    [excludeTokens, tokens]
  );

  const [input, setInput] = useState('');

  const handleInput: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const v = e.target.value;
    if (!/^\d*(\.\d*)?$/.test(v)) {
      return;
    }
    setInput(v);
    if (onChange) {
      onChange(v);
    }
  };

  useEffect(() => {
    if (currentAccount?.address && open) {
      handleLoadTokens();
    }
  }, [currentAccount?.address, handleLoadTokens, open]);

  useEffect(() => {
    setTokens([]);
    setOriginTokenList([]);
    latestChainId.current = chainId;
  }, [chainId]);

  useEffect(() => {
    if (forceFocus) {
      inputRef.current?.focus();
    }
  }, [forceFocus]);

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
              <span className="text" title={token.symbol}>
                {token.symbol}
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
            <Input
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
          columns={type === 'default' ? 3 : 2}
        />
      </Wrapper>
    </>
  );
};

export default TokenSelect;
