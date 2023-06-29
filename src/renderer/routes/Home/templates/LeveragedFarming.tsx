import React from 'react';
import { PortfolioItem } from '@rabby-wallet/rabby-api/dist/types';
import { Table } from '../components/Table';
import * as Value from '../components/Value';
import Panel from '../components/Panel';

export default React.memo((props: { data: PortfolioItem[] }) => {
  const data = props.data;
  const headers = ['Pool', 'Supply', 'Borrow', 'Debt Ratio', 'USD Value'];
  return (
    <Panel>
      <Table>
        <Table.Header headers={headers} />
        <Table.Body>
          {data.map((p: any) => {
            const supply_token_list = p.detail.supply_token_list;
            const debt_token = p.detail.borrow_token_list;
            return (
              <Table.Row>
                <Value.Tokens value={supply_token_list} />
                <Value.Balances value={supply_token_list} />
                <Value.Balances value={debt_token} />
                <Value.Percent value={p.detail.debt_ratio} />
                <Value.USDValue value={p.stats.net_usd_value} />
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </Panel>
  );
});
