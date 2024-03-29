import React from 'react';
import { PortfolioItem } from '@rabby-wallet/rabby-api/dist/types';
import { Table } from '../components/Table';
import * as Value from '../components/Value';
import Panel from '../components/Panel';

export default React.memo((props: { data: PortfolioItem[] }) => {
  const data: any = props.data;
  return data.map((p: any) => {
    return (
      <Panel>
        <Table>
          <Table.Header
            headers={[
              'Type',
              'Underlying',
              'Strike',
              'Style',
              'Expiration',
              'USD Value',
            ]}
          />
          <Table.Body>
            <Table.Row>
              <Value.String value={p.detail.type} />
              <Value.Balances value={p.detail.underlying_token} />
              <Value.Balances value={p.detail.strike_token} />
              <Value.String value={p.detail.style} />
              <Value.Time value={p.detail.exercise_end_at} />
              <Value.USDValue value={p.stats.net_usd_value} />
            </Table.Row>
          </Table.Body>
        </Table>

        {Boolean(p.detail.collateral_token_list?.length) && (
          <>
            {/* <Value.Divider /> */}
            <Table>
              <Table.Header headers={['Collateral', 'Balance', 'USD Value']} />
              <Table.Body>
                {p.detail.collateral_token_list.map((token: any) => {
                  return (
                    <Table.Row>
                      <Value.Token value={token} />
                      <Value.Balance value={token} />
                      <Value.TokenUSDValue value={token} />
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table>
          </>
        )}
      </Panel>
    );
  });
});
