import React, {
  ComponentProps,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Input, Skeleton, Space } from 'antd';
import cloneDeep from 'lodash/cloneDeep';
import BigNumber from 'bignumber.js';
// import { TokenItem } from 'background/service/openapi';
// import { useWallet } from 'ui/utils';
// import TokenWithChain from '../TokenWithChain';
// import TokenSelector, { isSwapTokenType } from '../TokenSelector';
import styled from 'styled-components';
// import LessPalette, { ellipsis } from '@/ui/style/var-defs';
import IconRcArrowDownTriangle from '@/../assets/icons/swap/arrow-caret-down2.svg?rc';
import { TokenItem } from '@debank/rabby-api/dist/types';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import openapi from '@/renderer/utils/openapi';
import TokenWithChain from '@/renderer/components/TokenWithChain';

const TokenWrapper = styled.div`
  /* width: 92px; */
  /* height: 30px; */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 4px;
  border-radius: 4px;
  &:hover {
    background: rgba(134, 151, 255, 0.3);
  }
`;

const SelectTips = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 150px;
  height: 32px;
  color: #fff;
  background: #8697ff;
  border-radius: 4px;
  font-weight: 500;
  font-size: 20px;
  line-height: 23px;
  & svg {
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
    color: #161819;
    flex: 1;
    font-weight: 500;
    font-size: 22px;
    line-height: 26px;

    text-align: right;
    color: #13141a;
    padding-right: 0;

    &:placeholder {
      color: #707280;
    }
  }
`;

const Text = styled.span`
  font-weight: 500;
  font-size: 20px;
  line-height: 23px;
  color: var(--color-title);
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

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
}

const TokenSelect = ({
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
}: TokenAmountInputProps) => {
  const latestChainId = useRef(chainId);
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [originTokenList, setOriginTokenList] = useState<TokenItem[]>([]);
  const [isListLoading, setIsListLoading] = useState(true);
  const [tokenSelectorVisible, setTokenSelectorVisible] = useState(false);

  const { currentAccount } = useCurrentAccount();
  // const wallet = useWallet();

  // const isSwapType = isSwapTokenType(type);

  const handleCurrentTokenChange = (t: TokenItem) => {
    if (onChange) {
      onChange('');
    }
    onTokenChange(t);
    setTokenSelectorVisible(false);
  };

  const handleTokenSelectorClose = () => {
    setTokenSelectorVisible(false);
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
    const getDefaultTokens = openapi.getSwapTokenList;

    const currentAddress = currentAccount?.address || '';
    const defaultTokens = await getDefaultTokens(currentAddress, chainId);

    if (chainId !== latestChainId.current) return;
    tokenList = sortTokensByPrice(defaultTokens).filter((e) =>
      type === 'swapFrom' ? e.amount > 0 : true
    );
    setOriginTokenList(tokenList);
    setTokens(tokenList);
    setIsListLoading(false);
  };

  const handleSelectToken = () => {
    setTokenSelectorVisible(true);
    handleLoadTokens();
  };

  const handleSearchTokens = async (q: string) => {
    if (!q) {
      setTokens(originTokenList);
      return;
    }
    setIsListLoading(true);
    try {
      const data = await openapi.searchSwapToken(
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
          <Skeleton.Input
            active
            style={{
              width: 110,
              height: 20,
            }}
          />
        ) : (
          <Input
            className="h-[30px] max-w-"
            readOnly={type === 'swapTo'}
            placeholder="0"
            autoFocus={type !== 'swapTo'}
            autoCorrect="false"
            autoComplete="false"
            value={value ?? input}
            onChange={type !== 'swapTo' ? handleInput : undefined}
          />
        )}
      </Wrapper>
      {/* <TokenSelector
        visible={tokenSelectorVisible}
        list={availableToken}
        onConfirm={handleCurrentTokenChange}
        onCancel={handleTokenSelectorClose}
        onSearch={handleSearchTokens}
        isLoading={isListLoading}
        type={type}
        placeholder={placeholder}
        chainId={chainId}
      /> */}
    </>
  );
};

export default TokenSelect;
