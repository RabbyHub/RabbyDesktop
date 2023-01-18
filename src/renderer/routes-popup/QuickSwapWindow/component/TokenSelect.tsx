import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Drawer, DrawerProps, Empty, Input, InputRef, Skeleton } from 'antd';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import IconRcArrowDownTriangle from '@/../assets/icons/swap/arrow-caret-down2.svg?rc';
import { TokenItem } from '@debank/rabby-api/dist/types';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import TokenWithChain from '@/renderer/components/TokenWithChain';
import IconRcBack from '@/../assets/icons/swap/back.svg?rc';
import IconRcSearch from '@/../assets/icons/swap/search.svg?rc';
import { formatTokenAmount, splitNumberByStep } from '@/renderer/utils/number';
import { useDebounce } from 'react-use';
import { walletOpenapi } from '@/renderer/ipcRequest/rabbyx';

const TokenWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 4px;
  border-radius: 4px;
  &:hover {
    background: rgba(134, 151, 255, 0.6);
  }
`;

const SelectTips = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 159px;
  height: 44px;
  color: #fff;
  background: #424959;
  border-radius: 4px;
  font-weight: 500;
  font-size: 20px;
  line-height: 23px;
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

  & .ant-input {
    background-color: transparent;
    border-color: transparent;
    color: white;
    flex: 1;
    font-weight: 500;
    font-size: 22px;
    line-height: 26px;

    text-align: right;
    padding-right: 0;

    &:focus {
      border-color: transparent;
      box-shadow: none;
    }

    &:placeholder {
      color: #a9aaae;
    }
  }
`;

const Text = styled.span`
  font-weight: 500;
  font-size: 20px;
  line-height: 23px;
  color: white;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TitleWrapper = styled.div`
  .title {
    font-weight: 510;
    font-size: 20px;
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
`;

const StyledDrawer = styled(Drawer)`
  .container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  .searchIcon {
    font-size: 16px;
  }

  .ant-input-affix-wrapper {
    margin-top: 24px;
    margin-bottom: 14px;
    height: 36px;
    font-size: 12px;
    line-height: 14px;
    border: 1px solid #5f6572;
    box-shadow: none;
    border-radius: 6px;
    background-color: transparent;
    color: var(--color-purewhite);

    &.ant-input-affix-wrapper-focused {
      border: 1px solid var(--color-primary);
    }

    & input::placeholder {
      color: #707280;
    }
  }

  .listHeader {
    display: flex;
    justify-content: space-between;
    font-weight: 400;
    font-size: 12px;
    line-height: 14px;
    color: rgba(255, 255, 255, 0.8);
    margin: 0 -10px;
    padding: 0 10px;
    padding-bottom: 12px;
    border-bottom: 1px solid #4f5562;
    .right {
      color: rgba(255, 255, 255, 0.3);
    }
  }

  .listBox {
    flex: 1;
    overflow: scroll;
    margin: 0 -10px;
    padding: 2px 10px;
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

  .left {
    display: flex;
    align-items: center;

    .tokenInfo {
      margin-left: 11px;
      display: flex;
      flex-direction: column;

      .symbol {
        font-weight: 510;
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
    display: flex;
    justify-content: flex-end;
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
    font-size: 14px;
    text-align: center;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 12px;
  }
  .noResultTip {
    font-size: 13px;
    text-align: center;
    color: rgba(255, 255, 255, 0.6);
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
  .w-140 {
    width: 140px;
  }
  .w-90 {
    width: 90px;
  }
  .w-60 {
    width: 60px;
  }
`;

const SwapLoading = () => (
  <SwapLoadingWrapper>
    <div className="left ">
      <Skeleton.Input
        active
        className="w-140"
        style={{
          height: 15,
        }}
      />
      <Skeleton.Input
        active
        className="w-90"
        style={{
          height: 15,
        }}
      />
    </div>
    <div className="right">
      <Skeleton.Input
        active
        className="w-60"
        style={{
          height: 14,
        }}
      />
      <Skeleton.Input
        active
        className="w-60"
        style={{
          height: 14,
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
  getContainer?: DrawerProps['getContainer'];
}

const TokenSelectDrawer = ({
  title = 'Select a token',
  open = false,
  list,
  onConfirm,
  isLoading = false,
  onSearch,
  onClose,
  placeholder = 'Search by Name / Address',
  getContainer = false,
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

  return (
    <StyledDrawer
      getContainer={getContainer}
      maskClosable={false}
      closable={false}
      placement="right"
      // height="706"
      width="100%"
      open={open}
      destroyOnClose
      bodyStyle={{
        padding: '20px 10px 0px 10px',
        overflow: 'hidden',
        backgroundColor: 'var(--swap-bg)',
      }}
      push={false}
    >
      <div className="container">
        <TitleWrapper>
          <IconRcBack className="back" onClick={onClose} />
          <div className="title">{title}</div>
        </TitleWrapper>

        <Input
          prefix={<IconRcSearch className="searchIcon" />}
          value={query}
          placeholder={placeholder}
          size="large"
          onChange={handleQueryChange}
        />

        <div className="listHeader">
          <div className="left">Token</div>
          <div className="right">Balance / Value</div>
        </div>

        <div className="listBox">
          {!isLoading && isEmpty && (
            <Empty
              image="rabby-internal://assets/icons/swap/nodata-tx.png"
              imageStyle={{
                marginTop: 80,
              }}
              description={
                <>
                  <div className="noResult">No Results</div>
                  <div className="noResultTip">
                    Only tokens listed in Rabby by default are supported for
                    swap
                  </div>
                </>
              }
            />
          )}
          {isLoading && (
            <div>
              {Array(12)
                .fill(1)
                .map(() => (
                  <SwapLoading />
                ))}
            </div>
          )}
          {!isLoading &&
            !isEmpty &&
            list.map((t) => (
              <div key={t.id} className="item" onClick={() => onConfirm(t)}>
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
            ))}
        </div>
      </div>
    </StyledDrawer>
  );
};

interface TokenAmountInputProps {
  token?: TokenItem;
  onChange?(amount: string): void;
  onTokenChange(token: TokenItem): void;
  chainId: string;
  excludeTokens?: TokenItem['id'][];
  type: 'swapTo' | 'swapFrom';
  // type?: ComponentProps<typeof TokenSelector>['type'];
  placeholder?: string;
  hideChainIcon?: boolean;
  value?: string;
  loading?: boolean;
  getContainer?: DrawerProps['getContainer'];
  forceFocus?: boolean;
}

export const TokenSelect = ({
  token,
  onChange,
  onTokenChange,
  chainId,
  excludeTokens = [],
  type = 'swapTo',
  placeholder,
  hideChainIcon = true,
  value,
  loading = false,
  getContainer,
  forceFocus = false,
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

  const sortTokensByPrice = (t: TokenItem[]) => {
    return [...t].sort((a, b) => {
      return new BigNumber(b.amount)
        .times(new BigNumber(b.price || 0))
        .minus(new BigNumber(a.amount).times(new BigNumber(a.price || 0)))
        .toNumber();
    });
  };

  const handleLoadTokens = async () => {
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
  };

  const handleSelectToken = () => {
    setOpen(true);
    handleLoadTokens();
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
      <Wrapper>
        <div onClick={handleSelectToken}>
          {token ? (
            <TokenWrapper>
              <TokenWithChain
                width="24px"
                height="24px"
                token={token}
                hideConer
                hideChainIcon={hideChainIcon}
              />
              <Text title={token.symbol}>{token.symbol}</Text>
              <IconRcArrowDownTriangle className="ml-[3px]" />
            </TokenWrapper>
          ) : (
            <SelectTips>
              <span>Select Token</span>
              <IconRcArrowDownTriangle className="brightness-[100] ml-[7px]" />
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
          <Input
            ref={inputRef}
            className="amountInput"
            readOnly={type === 'swapTo'}
            placeholder="0"
            autoFocus={type !== 'swapTo'}
            autoCorrect="false"
            autoComplete="false"
            value={value ?? input}
            onChange={type !== 'swapTo' ? handleInput : undefined}
          />
        )}
        <TokenSelectDrawer
          open={open}
          placeholder={placeholder}
          list={availableToken}
          onClose={handleTokenSelectorClose}
          onSearch={handleSearchTokens}
          onConfirm={handleCurrentTokenChange}
          isLoading={isListLoading}
          getContainer={getContainer}
        />
      </Wrapper>
    </>
  );
};

export default TokenSelect;
