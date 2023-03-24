import React from 'react';
import { sortBy } from 'lodash';
import { PortfolioItem } from '@debank/rabby-api/dist/types';
import { Tooltip } from 'antd';
import styled from 'styled-components';
import { Table } from '../components/Table';
import Panel from '../components/Panel';
import * as Value from '../components/Value';

const HealthRateTag = styled.div`
  display: flex;
  font-size: 14px;
  line-height: 17px;
  color: rgba(255, 255, 255, 0.5);
  align-items: center;
  margin-bottom: 16px;
  padding-left: 22px;
  .icon-info {
    margin-left: 4px;
    margin-right: 4px;
    cursor: pointer;
  }
  .rate-number {
    color: #fff;
  }
`;

export default React.memo((props: { data: PortfolioItem[] }) => {
  const data = props.data;
  return (
    <>
      {data.map((p: any) => {
        const supplyHeaders = ['Supplied', 'Balance', 'USD Value'];
        const borrowHeaders = ['Borrowed', 'Balance', 'USD Value'];
        const rewardHeaders = ['Rewards', 'Balance', 'USD Value'];

        return (
          <Panel>
            {p.detail.health_rate && (
              <HealthRateTag>
                Health Rate
                <Tooltip title="Your assests will be liquidated if the health factor is less than or equal to 1">
                  <img
                    src="rabby-internal://assets/icons/home/info.svg"
                    alt=""
                    className="icon-info"
                  />
                </Tooltip>
                <span className="rate-number">
                  {p.detail.health_rate <= 10
                    ? p.detail.health_rate.toFixed(2)
                    : '>10'}
                </span>
              </HealthRateTag>
            )}
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
                </Table.Body>
              </Table>
            ) : null}
            {p.detail.borrow_token_list?.length > 0 && (
              <>
                {/* <Value.Divider /> */}
                <Table>
                  <Table.Header headers={borrowHeaders} />
                  <Table.Body>
                    {sortBy(
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
              </>
            )}
            {p.detail.reward_token_list?.length > 0 && (
              <>
                {/* <Value.Divider /> */}
                <Table>
                  <Table.Header headers={rewardHeaders} />
                  <Table.Body>
                    {sortBy(
                      p.detail.reward_token_list,
                      (v) => v.amount * (v.price || 0)
                    )
                      ?.reverse()
                      .map((token: any) => {
                        return (
                          <Table.Row>
                            <Value.Token value={token} />
                            <Value.Balance value={token} />
                            <Value.USDValue
                              value={token.amount * token.price}
                            />
                          </Table.Row>
                        );
                      })}
                  </Table.Body>
                </Table>
              </>
            )}
          </Panel>
        );
      })}
    </>
  );
});
