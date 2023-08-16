import { ReactNode, useMemo } from 'react';
import dayjs from 'dayjs';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import {
  formatUsdValue,
  formatAmount,
  formatNumber,
} from '@/renderer/utils/number';
import {
  getTokens,
  ellipsisTokenSymbol,
  getUsd,
  PortfolioItemToken,
} from '@/renderer/utils/token';
import {
  getCollectionDisplayName,
  polyNfts,
  PortfolioItemNft,
} from '@/renderer/utils/nft';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import { TokenActionSymbol } from '@/renderer/components/TokenActionModal/TokenActionModal';
import LabelWithIcon from '@/renderer/components/LabelWithIcon';
import { IconWithChain } from '@/renderer/components/TokenWithChain';
import { TipsWrapper } from '@/renderer/components/TipWrapper';
import { getTokenSymbol } from '@/renderer/utils';
import { Table } from './Table';

const Col = Table.Col;

const DebtTag = styled.div`
  border: 1px solid #ff6565;
  border-radius: 4px;
  padding: 2px 5px;
  font-weight: 700;
  font-size: 10px;
  line-height: 12px;
  text-transform: uppercase;
  color: #ff6565;
  margin-left: 6px;
`;

const TokenAmountWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 7px;
  &:nth-last-child(1) {
    margin-bottom: 0;
  }
`;

const StringDiv = styled.div`
  word-break: break-all;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  font-size: 13px;
`;

const TokensAmount = ({
  tokens,
  withPrice = false,
  isDebt = false,
}: {
  tokens: TokenItem[];
  withPrice?: boolean;
  isDebt?: boolean;
}) => {
  return (
    <div>
      {tokens
        .filter((item) => !!item)
        .map((item) => (
          <TokenAmountWrapper>
            <span>
              {formatAmount(item.amount)}{' '}
              <TokenActionSymbol token={item}>
                {ellipsisTokenSymbol(getTokenSymbol(item))}
              </TokenActionSymbol>
            </span>
            {item.price !== 0 &&
              withPrice &&
              `(${formatUsdValue(
                new BigNumber(item.price).times(item.amount).toFixed()
              )})`}
            {isDebt ? <DebtTag>Debt</DebtTag> : null}
          </TokenAmountWrapper>
        ))}
    </div>
  );
};

export const String = ({ value }: { value: ReactNode }) => {
  return (
    <Col>
      <StringDiv>{value}</StringDiv>
    </Col>
  );
};

export const Time = ({ value }: { value: string | number | undefined }) => {
  return (
    <Col>
      {!value ? '-' : dayjs(Number(value) * 1000).format('YYYY/MM/DD HH:mm')}
    </Col>
  );
};

export const Balances = ({
  value,
  isDebt = false,
}: {
  value: TokenItem[];
  isDebt?: boolean;
}) => {
  value = Array.isArray(value) ? value : [value];
  return (
    <Col>{!value ? '' : <TokensAmount tokens={value} isDebt={isDebt} />}</Col>
  );
};

export const Balance = ({
  value,
  isDebt = false,
}: {
  value: TokenItem;
  isDebt?: boolean;
}) => {
  return (
    <Col>
      <TokensAmount tokens={[value]} isDebt={isDebt} />
    </Col>
  );
};

export const TokensSlash = ({ value }: { value: TokenItem[] }) => {
  value = Array.isArray(value) ? value : [value];
  return <Col>{getTokens(value, '/')}</Col>;
};

export const Tokens = ({
  value,
  isDebt = false,
  nfts,
}: {
  value: TokenItem[];
  isDebt?: boolean;
  nfts?: PortfolioItemNft[];
}) => {
  value = Array.isArray(value) ? value : [value];
  return <Col>{getTokens(value, undefined, isDebt, nfts)}</Col>;
};

export const Token = ({
  value,
  isDebt = false,
}: {
  value: TokenItem;
  isDebt?: boolean;
}) => {
  return <Tokens value={[value]} isDebt={isDebt} />;
};

export const USDValue = ({ value }: { value: string | number }) => {
  return <Col>{formatUsdValue(value)}</Col>;
};

export const TokensUSDValue = ({ value }: { value: TokenItem[] }) => {
  return <Col>{getUsd(value)}</Col>;
};

export const TokenUSDValue = ({ value }: { value: TokenItem }) => {
  return <TokensUSDValue value={[value]} />;
};

export const Bool = ({ value }: { value: number }) => {
  return <Col>{value ? 'Yes' : 'No'}</Col>;
};

export const Percent = ({ value }: { value?: number | string }) => {
  // if (value === undefined || Number.isNaN(+value)) return <Col />;
  return <Col>{formatNumber((value ? +value : 0) * 100)}%</Col>;
};

export const NumberWithCommas = ({ value }: { value: number | string }) => {
  return <Col>{formatNumber(value)}</Col>;
};

export const NumbersWithCommas = ({
  value,
}: {
  value: (number | string | undefined)[];
}) => {
  return <Col>{value.map((v) => (v ? formatNumber(v) : '-')).join(' / ')}</Col>;
};

export const ClaimableTokens = ({
  value,
  isDebt = false,
}: {
  value: TokenItem | TokenItem[];
  isDebt?: boolean;
}) => {
  return (
    <Col>
      <TokensAmount
        tokens={Array.isArray(value) ? value : [value]}
        withPrice
        isDebt={isDebt}
      />
    </Col>
  );
};

const DeviderWrapper = styled.div`
  background-color: rgba(255, 255, 255, 0.1);
  height: 1px;
  margin-bottom: 12px;
`;
export const Divider = () => {
  return <DeviderWrapper />;
};

export const BlancesWithNfts = ({
  tokens,
  nfts,
}: {
  tokens: TokenItem[];
  nfts?: PortfolioItemNft[];
}) => {
  const hasNft = !!nfts?.length;
  return (
    <Col className="flex-col items-start">
      {hasNft &&
        nfts.map((n) => (
          <div className="mb-4">
            {getCollectionDisplayName(n.collection)} x{n.amount}
          </div>
        ))}
      <TokensAmount tokens={tokens} />
    </Col>
  );
};

export const NFTTable = ({
  name,
  tokens,
}: {
  name: string;
  tokens?: PortfolioItemNft[];
}) => {
  const headers = useMemo(() => [name, 'Balance', 'USD Value'], [name]);

  const nfts = useMemo(
    () =>
      tokens?.length
        ? polyNfts(tokens)
            .sort((m, n) => (n.amount || 0) - (m.amount || 0))
            .map((x) => {
              const collection = x.collection;
              const collectionName = getCollectionDisplayName(collection);

              return {
                ...x,
                collectionName,
              };
            })
        : [],
    [tokens]
  );

  return tokens?.length ? (
    <Table>
      <Table.Header headers={headers} />
      <Table.Body>
        {nfts?.map((x, i) => (
          <Table.Row key={x.id}>
            <Col>
              <LabelWithIcon
                icon={
                  <div className="mr-5px">
                    <IconWithChain
                      chainServerId="eth"
                      width="22px"
                      height="22px"
                      iconUrl={x.collection.logo_url}
                      hideChainIcon
                      noRound
                    />
                  </div>
                }
                label={x.collectionName}
              />
            </Col>
            <Col>
              <div>
                {x.collectionName} x{x.amount}
              </div>
            </Col>
            <Col>
              <span>-</span>
              <TipsWrapper hoverTips="NFT value not included in the net worth of this protocol">
                <img
                  className="w-14 h-14 ml-4"
                  src="rabby-internal://assets/icons/home/info.svg"
                />
              </TipsWrapper>
            </Col>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  ) : null;
};

export const TokenTable = ({
  name,
  tokens,
}: {
  name: string;
  tokens?: PortfolioItemToken[];
}) => {
  const headers = useMemo(() => [name, 'Balance', 'USD Value'], [name]);

  const _tokens = useMemo(
    () =>
      tokens?.length
        ? tokens
            ?.map((x) => ({
              ...x,
              _netWorth: x.amount * x.price,
            }))
            .sort((m, n) => n._netWorth - m._netWorth)
        : [],
    [tokens]
  );

  return _tokens?.length > 0 ? (
    <Table>
      <Table.Header headers={headers} />
      <Table.Body>
        {_tokens?.map((token: any) => {
          return (
            <Table.Row key={token?.id}>
              <Token value={token} />
              <Balance value={token} />
              <USDValue value={token._netWorth} />
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table>
  ) : null;
};
