import React from 'react';
import { Tooltip } from 'antd';
import { PortfolioItem } from '@debank/rabby-api/dist/types';
import styled from 'styled-components';
import { sortBy } from 'lodash';
import LabelWithIcon from '@/renderer/components/LabelWithIcon';
import { IconWithChain } from '@/renderer/components/TokenWithChain';
import IconNftUsdInfo from '@/../assets/icons/home/nft-usd-info.svg';
import { formatUsdValue } from '@/renderer/utils/number';
import { getCollectionDisplayName, polyNfts } from '@/renderer/utils/nft';
import Panel from '../components/Panel';
import { Table } from '../components/Table';
import * as Value from '../components/Value';

const Col = Table.Col;

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

const NFTLendingWrapper = styled.div`
  .nft-lending-col {
    .token-logo {
      background-color: #e6e6e6;
    }
  }
`;

export default React.memo((props: { data: PortfolioItem[] }) => {
  const data = props.data;

  return (
    <NFTLendingWrapper>
      {data.map((p: any) => {
        const supplyHeaders = ['Supplied', 'Balance', 'USD Value'];
        const borrowHeaders = ['Borrowed', 'Balance', 'USD Value'];
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
            {p.detail.supply_token_list?.length > 0 ||
            p.detail.supply_nft_list?.length > 0 ? (
              <Table>
                <Table.Header headers={supplyHeaders} />
                <Table.Body>
                  {polyNfts(p.detail.supply_nft_list ?? [])
                    .map((x) => {
                      const collection = x.collection;
                      const floorToken = collection?.floor_price_token;
                      const usdValue = floorToken
                        ? floorToken.amount * floorToken.price * x.amount
                        : 0;
                      const _usdValue = usdValue
                        ? formatUsdValue(usdValue)
                        : '-';
                      const collectionName =
                        getCollectionDisplayName(collection);

                      return {
                        ...x,
                        usdValue,
                        _usdValue,
                        collectionName,
                      };
                    })
                    .sort((m, n) => n.usdValue - m.usdValue)
                    .map((x) => (
                      <Table.Row>
                        <Col className="nft-lending-col">
                          <LabelWithIcon
                            icon={
                              <IconWithChain
                                chainServerId={p.pool.chain}
                                width="22px"
                                height="22px"
                                iconUrl={x.collection.logo_url}
                                hideChainIcon
                                noRound
                              />
                            }
                            label={x.collectionName}
                          />
                        </Col>
                        <Col>
                          <div>
                            {x.collectionName} x{x.amount}
                          </div>
                        </Col>
                        <Col>
                          {x.usdValue ? (
                            <>
                              {x._usdValue}
                              <Tooltip title="Calculated based on the floor price recognized by this protocol.">
                                <img
                                  src={IconNftUsdInfo}
                                  style={{
                                    marginLeft: 4,
                                    width: 10,
                                    height: 10,
                                  }}
                                />
                              </Tooltip>
                            </>
                          ) : (
                            '-'
                          )}
                        </Col>
                      </Table.Row>
                    ))}
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
            {p.detail.borrow_token_list?.length > 0 ? (
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
                          <Value.Token value={token} />
                          <Value.Balance value={token} />
                          <Value.USDValue value={token.amount * token.price} />
                        </Table.Row>
                      );
                    })}
                </Table.Body>
              </Table>
            ) : null}
          </Panel>
        );
      })}
    </NFTLendingWrapper>
  );
});
