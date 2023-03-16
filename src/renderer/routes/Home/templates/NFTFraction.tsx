import React from 'react';
import { Tooltip } from 'antd';
import { PortfolioItem } from '@debank/rabby-api/dist/types';
import styled from 'styled-components';
import LabelWithIcon from '@/renderer/components/LabelWithIcon';
import { IconWithChain } from '@/renderer/components/TokenWithChain';
import IconNftUsdInfo from '@/../assets/icons/home/nft-usd-info.svg';
import { formatUsdValue, formatAmount } from '@/renderer/utils/number';
import { getCollectionDisplayName, NftCollection } from '@/renderer/utils/nft';
import Panel from '../components/Panel';
import { Table } from '../components/Table';

const Col = Table.Col;

const IconWrapper = styled.div`
  .token-logo {
    background-color: #e6e6e6;
  }
`;

const FractionNftRow = ({
  collection,
  usdValue,
  amount,
  symbol = '',
}: {
  collection: NftCollection;
  usdValue: number;
  amount?: number;
  symbol?: string;
}) => {
  const collectionName = getCollectionDisplayName(collection);
  return (
    <Table.Row>
      <Col>
        <IconWrapper>
          <LabelWithIcon
            icon={
              <IconWithChain
                chainServerId="eth"
                width="22px"
                height="22px"
                iconUrl={collection.logo_url}
                hideChainIcon
                noRound
              />
            }
            label={collectionName}
          />
        </IconWrapper>
      </Col>
      <Col>
        <div>
          {formatAmount(amount ?? 0)} {symbol}
        </div>
      </Col>
      <Col>
        {usdValue ? (
          <>
            {formatUsdValue(usdValue)}
            <Tooltip title="Calculate based on the price of the linked ERC20 token.">
              <img
                src={IconNftUsdInfo}
                style={{ marginLeft: 4, width: 10, height: 10 }}
              />
            </Tooltip>
          </>
        ) : (
          '-'
        )}
      </Col>
    </Table.Row>
  );
};

export default React.memo((props: { data: PortfolioItem[] }) => {
  const data = props.data;

  return (
    <Panel>
      <Table>
        <Table.Header headers={['Collection', 'Balance', 'USD Value']} />
        <Table.Body>
          {data
            .sort((m: any, n: any) =>
              !n.stats.net_usd_value && !m.stats.net_usd_value
                ? (n.detail.share_token?.amount || 0) -
                  (m.detail.share_token?.amount || 0)
                : (n.stats.net_usd_value || 0) - (m.stats.net_usd_value || 0)
            )
            .map((p: any) => {
              return (
                <FractionNftRow
                  collection={p.detail.collection}
                  usdValue={p.stats.net_usd_value}
                  amount={p.detail.share_token?.amount}
                  symbol={p.detail.share_token?.symbol}
                />
              );
            })}
        </Table.Body>
      </Table>
    </Panel>
  );
});
