/* eslint-disable import/no-cycle */
import styled from 'styled-components';
import { numberWithCommasIsLtOne } from '@/renderer/utils/number';
import { getTokenSymbol } from '@/renderer/utils';
import { TransactionDataItem } from '@/isomorphic/types/rabbyx';

const TxChangeWrapper = styled.div`
  margin-left: 27px;
  color: rgba(255, 255, 255, 0.65);
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  max-width: 124px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  .token-change-item {
    text-align: right;
    width: 100%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    margin-bottom: 4px;
    &:nth-last-child(1) {
      margin-bottom: 0;
    }
    .token-change-item-text {
    }
  }
`;

const TokenChange = ({
  sends,
  receives,
}: {
  sends: TransactionDataItem['sends'];
  receives: TransactionDataItem['receives'];
}) => {
  if (!sends?.length && !receives?.length) {
    return null;
  }
  if (sends.length + receives.length > 2) {
    return (
      <TxChangeWrapper className="ui token-change">
        {receives.length > 0 && (
          <div className="token-change-item is-success">
            + {`${receives.length} Assets`}
          </div>
        )}
        {sends.length > 0 && (
          <div className="token-change-item is-success">
            - {`${sends.length} Assets`}
          </div>
        )}
      </TxChangeWrapper>
    );
  }
  return (
    <TxChangeWrapper className="ui token-change">
      {sends?.map((v) => {
        const { token } = v;
        const isNft = v.tokenId.length === 32;
        const symbol = getTokenSymbol(token);
        const name = isNft
          ? token?.name ||
            (symbol ? `${symbol} ${token?.inner_id}` : 'Unknown NFT')
          : symbol;

        return (
          <div
            className="token-change-item"
            title={name}
            data-id={token?.id}
            data-name={name}
            key={token?.id}
          >
            -{' '}
            {`${
              isNft ? v.amount : numberWithCommasIsLtOne(v.amount, 4)
            } ${name}`}
          </div>
        );
      })}
      {receives?.map((v) => {
        const { token } = v;
        const isNft = v.tokenId.length === 32;
        const symbol = getTokenSymbol(token);
        const name = isNft
          ? token?.name ||
            (symbol ? `${symbol} ${token?.inner_id}` : 'Unknown NFT')
          : symbol;

        return (
          <div
            data-id={token?.id}
            data-name={name}
            className="token-change-item is-success"
            title={name}
            key={token?.id}
          >
            +{' '}
            {`${
              isNft ? v.amount : numberWithCommasIsLtOne(v.amount, 2)
            } ${name}`}
          </div>
        );
      })}
    </TxChangeWrapper>
  );
};

export default TokenChange;
