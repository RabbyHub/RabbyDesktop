import React from 'react';
import { PortfolioItem } from '@debank/rabby-api/dist/types';
import { Table } from '../components/Table';
import * as Value from '../components/Value';
import Panel from '../components/Panel';

export default React.memo((props: { data: PortfolioItem[] }) => {
  const data: any = props.data;
  const headers = ['Pool', 'Balance'];

  const has_daily_unlock_amount = data.some(
    (v: any) => v.detail.daily_unlock_amount !== undefined
  );
  const has_end_at = data.some((v: any) => v.detail.end_at !== undefined);
  const hasClaimableAmount = data.some(
    (v: any) => typeof v.detail.token.claimable_amount !== 'undefined'
  );

  if (hasClaimableAmount) headers.push('Claimable Amount');
  if (has_daily_unlock_amount) headers.push('Daily Unlock Amount');
  if (has_end_at) headers.push('End Time');

  headers.push('USD Value');

  return (
    <Panel>
      <Table>
        <Table.Header headers={headers} />
        <Table.Body>
          {data.map((p: any) => {
            return (
              <Table.Row>
                <Value.Token value={p.detail.token} />
                <Value.Balance value={p.detail.token} />
                {hasClaimableAmount && (
                  <Value.NumberWithCommas
                    value={p.detail.token.claimable_amount}
                  />
                )}
                {has_daily_unlock_amount && (
                  <Value.NumberWithCommas
                    value={p.detail.daily_unlock_amount}
                  />
                )}
                {has_end_at && <Value.Time value={p.detail.end_at} />}
                <Value.USDValue value={p.stats.net_usd_value} />
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </Panel>
  );
});
