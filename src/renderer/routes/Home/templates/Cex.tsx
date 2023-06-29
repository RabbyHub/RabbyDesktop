import React from 'react';
import { sortBy } from 'lodash';
import { PortfolioItem } from '@rabby-wallet/rabby-api/dist/types';
import { Table } from '../components/Table';
import Panel from '../components/Panel';
import * as Value from '../components/Value';

export default React.memo((props: { data: PortfolioItem[] }) => {
  const data = props.data;
  return (
    <>
      {data.map((p: any) => {
        const supplyHeaders = ['Token', 'Balance', 'USD Value'];

        return (
          <Panel>
            {p.detail.supply_token_list?.length > 0 ? (
              <Table>
                <Table.Header headers={supplyHeaders} />
                <Table.Body>
                  {sortBy(
                    p.detail.supply_token_list,
                    (v) => v.amount * (v.price || 0)
                  )
                    ?.reverse()
                    .map((token: any) => {
                      return (
                        <Table.Row>
                          <Value.Token value={token} />
                          <Value.Balance value={token} />
                          <Value.USDValue value={token.amount * token.price} />
                        </Table.Row>
                      );
                    })}
                  {p.detail.borrow_token_list?.length > 0 &&
                    sortBy(
                      p.detail.borrow_token_list,
                      (v) => v.amount * (v.price || 0)
                    )
                      ?.reverse()
                      .map((token: any) => {
                        return (
                          <Table.Row>
                            <Value.Token value={token} isDebt />
                            <Value.Balance value={token} />
                            <Value.USDValue
                              value={token.amount * token.price}
                            />
                          </Table.Row>
                        );
                      })}
                </Table.Body>
              </Table>
            ) : null}
          </Panel>
        );
      })}
    </>
  );
});
