import React from 'react';
import { PortfolioItem } from '@rabby-wallet/rabby-api/dist/types';
import { Table } from '../components/Table';
import * as Value from '../components/Value';
import Panel from '../components/Panel';

export default React.memo((props: { data: PortfolioItem[] }) => {
  const data: any = props.data;
  const headers = ['Pool', 'Balance'];

  const hasDescription = data.some(
    (v: any) => v.detail.description !== undefined
  );
  const hasRewardTokenList = data.some(
    (v: any) => v.detail.reward_token_list !== undefined
  );
  const hasunlock_at = data.some((v: any) => v.detail.unlock_at !== undefined);
  if (hasRewardTokenList) headers.push('Rewards');
  if (hasDescription) headers.unshift('');
  if (hasunlock_at) headers.push('Unlock time');
  headers.push('USD Value');

  return (
    <Panel>
      <Table>
        <Table.Header headers={headers} />
        <Table.Body>
          {data.map((p: any) => {
            return (
              <Table.Row>
                {hasDescription && (
                  <Value.String value={p.detail.description} />
                )}
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
                {hasunlock_at && <Value.Time value={p.detail.unlock_at} />}
                <Value.USDValue value={p.stats.net_usd_value} />
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </Panel>
  );
});
