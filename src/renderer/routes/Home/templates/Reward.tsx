import React from 'react';
import { PortfolioItem } from '@rabby-wallet/rabby-api/dist/types';
import { Table } from '../components/Table';
import * as Value from '../components/Value';
import Panel from '../components/Panel';

export default React.memo((props: { data: PortfolioItem[] }) => {
  const data: any = props.data;
  const headers = ['Pool', 'Balance', 'USD Value'];
  return (
    <Panel>
      <Table>
        <Table.Header headers={headers} />
        <Table.Body>
          {data.map((p: any) => {
            return (
              <Table.Row>
                <Value.Tokens value={p.detail.token_list} />
                <Value.Balances value={p.detail.token_list} />
                <Value.USDValue value={p.stats.net_usd_value} />
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </Panel>
  );
});
