import React from 'react';
import { PortfolioItem } from '@debank/rabby-api/dist/types';
import { Table } from '../components/Table';
import * as Value from '../components/Value';
import Panel from '../components/Panel';

export default React.memo((props: { data: PortfolioItem[] }) => {
  const data = props.data;
  const headers = ['Description', 'Collateral', 'Balance'];
  const hasRewardTokenList = data.some(
    (v) => v.detail.reward_token_list !== undefined
  );
  const has_expired_at = data.some(
    (v: any) => v.detail.expired_at !== undefined
  );

  if (hasRewardTokenList) headers.push('Rewards');
  if (has_expired_at) headers.push('Expired Time');

  headers.push('USD Value');

  return (
    <Panel>
      <Table>
        <Table.Header headers={headers} />
        <Table.Body>
          {data.map((p: any) => {
            return (
              <Table.Row>
                <Value.String value={p.detail.description} />
                <Value.Tokens value={p.detail.collateral_token_list} />
                <Value.Balances value={p.detail.collateral_token_list} />
                {hasRewardTokenList && (
                  <Value.ClaimableTokens
                    value={
                      Array.isArray(p.detail.reward_token_list)
                        ? p.detail.reward_token_list
                        : [p.detail.reward_token_list]
                    }
                  />
                )}
                {has_expired_at && <Value.Time value={p.detail.expired_at} />}
                <Value.USDValue value={p.detail.usd_value} />
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </Panel>
  );
});
