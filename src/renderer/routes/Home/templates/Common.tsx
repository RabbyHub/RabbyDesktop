import { PortfolioItem } from '@debank/rabby-api/dist/types';
import Panel from '../components/Panel';
import { Table } from '../components/Table';
import * as Value from '../components/Value';

const Common = ({ data }: { data: PortfolioItem[] }) => {
  const headers = ['Pool', 'Balance'];
  const hasRewardTokenList = data.some(
    (v) => v.detail.reward_token_list !== undefined
  );
  const hasBorrowTokenList = data.some(
    (v) => v.detail.borrow_token_list !== undefined
  );

  if (hasRewardTokenList) headers.push('Rewards');
  if (hasBorrowTokenList) headers.push('Borrow');

  headers.push('USD Value');

  return (
    <Panel>
      <Table>
        <Table.Header headers={headers} />
        <Table.Body>
          {data.map((p) => {
            return (
              <Table.Row>
                <Value.Tokens value={p.detail.supply_token_list} />
                <Value.Balances value={p.detail.supply_token_list} />
                {hasRewardTokenList && (
                  <Value.ClaimableTokens
                    value={
                      Array.isArray(p.detail.reward_token_list)
                        ? p.detail.reward_token_list
                        : [p.detail.reward_token_list]
                    }
                  />
                )}
                {hasBorrowTokenList && (
                  <Value.ClaimableTokens
                    value={
                      Array.isArray(p.detail.borrow_token_list)
                        ? p.detail.borrow_token_list
                        : [p.detail.borrow_token_list]
                    }
                    isDebt
                  />
                )}
                <Value.USDValue value={p.stats.net_usd_value} />
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </Panel>
  );
};

export default Common;
