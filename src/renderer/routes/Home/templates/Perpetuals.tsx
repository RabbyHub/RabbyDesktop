import React from 'react';
import { PortfolioItem } from '@debank/rabby-api/dist/types';
import { Table } from '../components/Table';
import Panel from '../components/Panel';
import * as Value from '../components/Value';

export default React.memo((props: { data: PortfolioItem[] }) => {
  const data: any = props.data;

  return data.map((p: any) => (
    <Panel>
      <Table>
        <Table.Header
          headers={['Currency Pair', 'Side', 'Margin', 'P&L', 'USD Value']}
        />
        <Table.Body>
          <Table.Row>
            <Value.TokensSlash
              value={[p.detail.base_token, p.detail.quote_token]}
            />
            <Value.String value={p.detail.side} />
            <Value.Balance value={p.detail.margin_token} />
            <Value.USDValue value={p.detail.pnl_usd_value || 0} />
            <Value.USDValue value={p.stats.net_usd_value} />
          </Table.Row>
        </Table.Body>
      </Table>
    </Panel>
  ));
});
