import { useMemo } from 'react';
import styled from 'styled-components';
import BigNumber from 'bignumber.js';

import { noop } from 'lodash';
import { TCexQuoteData, TDexQuoteData, isSwapWrapToken } from '../utils';
import { IconRefresh } from './IconRefresh';
import { QuoteListLoading, QuoteLoading } from './QuoteLoading';
import { CexQuoteItem, DexQuoteItem, QuoteItemProps } from './QuoteItem';
import { DEX } from '../constant';

const QuotesWrapper = styled.div`
  --green-color: #27c193;
  --red-color: #ff7878;
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;

    .title {
      font-size: 18px;
      font-weight: medium;
      color: white;
    }
  }
`;

interface QuotesProps
  extends Omit<
    QuoteItemProps,
    | 'bestAmount'
    | 'name'
    | 'quote'
    | 'active'
    | 'isBestQuote'
    | 'quoteProviderInfo'
  > {
  list?: (TCexQuoteData | TDexQuoteData)[];
  activeName?: string;
  refresh?: () => void;
}
export const Quotes = (props: QuotesProps) => {
  const {
    list = [],
    loading = false,
    activeName,
    refresh = noop,
    ...other
  } = props;

  const sortedList = useMemo(
    () =>
      list.sort((a, b) => {
        const getNumber = (quote: typeof a) => {
          if (quote.isDex) {
            if (!quote.preExecResult) {
              return new BigNumber(0);
            }
            return new BigNumber(quote?.data?.toTokenAmount || 0);
          }

          return new BigNumber(quote?.data?.receive_token?.amount || 0).times(
            10 ** other.receiveToken.decimals
          );
        };
        return getNumber(b).minus(getNumber(a)).toNumber();
      }),
    [list, other?.receiveToken?.decimals]
  );

  const fetchedList = useMemo(() => list.map((e) => e.name), [list]);

  if (isSwapWrapToken(other.payToken.id, other.receiveToken.id, other.chain)) {
    const dex = sortedList.find((e) => e.isDex) as TDexQuoteData | undefined;

    return (
      <QuotesWrapper>
        <div className="header">
          <div className="title">The following swap rates are found</div>
          <IconRefresh refresh={refresh} loading={loading} />
        </div>
        <div className="flex flex-col gap-[16px]">
          {dex ? (
            <DexQuoteItem
              preExecResult={dex?.preExecResult}
              quote={dex?.data}
              name={dex?.name}
              isBestQuote
              bestAmount={dex?.data?.toTokenAmount || '0'}
              active={activeName === dex?.name}
              isLoading={dex.loading}
              quoteProviderInfo={{
                name: 'Wrap Contract',
                logo: other?.receiveToken?.logo_url,
              }}
              {...other}
            />
          ) : (
            <QuoteLoading
              name="Wrap Contract"
              logo={other?.receiveToken?.logo_url}
            />
          )}

          <div className="text-14 text-white text-opacity-80">
            Wrapping {other.receiveToken.name} tokens directly with the smart
            contract
          </div>
        </div>
      </QuotesWrapper>
    );
  }
  return (
    <QuotesWrapper>
      <div className="header">
        <div className="title">The following swap rates are found</div>
        <IconRefresh refresh={refresh} loading={loading} />
      </div>

      <div className="flex flex-col gap-[16px]">
        {sortedList.map((params, idx) => {
          const { name, data, isDex } = params;
          const bestQuote = sortedList?.[0];
          const bestAmount =
            (bestQuote?.isDex
              ? bestQuote?.data?.toTokenAmount
              : new BigNumber(bestQuote.data?.receive_token.amount || '0')
                  .times(10 ** other.receiveToken.decimals)
                  .toString(10)) || '0';
          if (isDex) {
            return (
              <DexQuoteItem
                preExecResult={params.preExecResult}
                quote={data}
                name={name}
                isBestQuote={idx === 0}
                bestAmount={`${bestAmount}`}
                active={activeName === name}
                isLoading={params.loading}
                quoteProviderInfo={DEX[name as keyof typeof DEX]}
                {...other}
              />
            );
          }
          return (
            <CexQuoteItem
              name={name}
              data={data}
              bestAmount={`${bestAmount}`}
              isBestQuote={idx === 0}
              isLoading={params.loading}
            />
          );
        })}
        <QuoteListLoading fetchedList={fetchedList} />
      </div>
    </QuotesWrapper>
  );
};
