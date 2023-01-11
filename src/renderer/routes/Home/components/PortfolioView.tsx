import styled from 'styled-components';
import { TokenItem } from '@debank/rabby-api/dist/types';
import TokenItemComp from './TokenItem';

const PortfolioWrapper = styled.div`
  background: rgba(255, 255, 255, 0.07);
  width: 100%;
  padding: 46px 27px;
  .assets-list {
    margin: 0;
    padding: 0;
    list-style: none;
    .th {
      display: flex;
      color: rgba(255, 255, 255, 0.5);
      font-weight: 400;
      font-size: 12px;
      line-height: 14px;
      padding: 0 23px;
      & > div {
        text-align: right;
        &:nth-child(1) {
          text-align: left;
          color: rgba(255, 255, 255, 0.8);
          width: 150px;
        }
        &:nth-child(2) {
          flex: 1;
        }
        &:nth-child(3) {
          width: 200px;
        }
        &:nth-child(4) {
          width: 200px;
        }
      }
    }
  }
`;
const PortfolioView = ({
  tokenList,
  historyTokenMap,
}: {
  tokenList: TokenItem[];
  historyTokenMap: Record<string, TokenItem>;
}) => {
  return (
    <PortfolioWrapper>
      <ul className="assets-list">
        <li className="th">
          <div>Asset</div>
          <div>Price</div>
          <div>Amount</div>
          <div>USD-Value</div>
        </li>
        {tokenList.map((token) => (
          <TokenItemComp
            token={token}
            historyToken={historyTokenMap[`${token.chain}-${token.id}`]}
            key={`${token.chain}-${token.id}`}
          />
        ))}
      </ul>
    </PortfolioWrapper>
  );
};

export default PortfolioView;
