import React from 'react';
import { PortfolioItem } from '@debank/rabby-api/dist/types';
import { Table } from '../components/Table';
import * as Value from '../components/Value';
import Panel from '../components/Panel';

export default React.memo((props: { data: PortfolioItem[] }) => {
  const data: any = props.data;
  const headers = ['Description'];

  const has_expired_at = data.some(
    (v: any) => v.detail.expired_at !== undefined
  );

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
