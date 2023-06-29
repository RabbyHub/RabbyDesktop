import { Tooltip } from 'antd';
import React from 'react';
import { PortfolioItem } from '@rabby-wallet/rabby-api/dist/types';
import { sortBy } from 'lodash';
import IconNftUsdInfo from '@/../assets/icons/home/nft-usd-info.svg';
import { formatUsdValue } from '@/renderer/utils/number';
import { polyNfts } from '@/renderer/utils/nft';
import Panel from '../components/Panel';
import { Table } from '../components/Table';
import * as Value from '../components/Value';

export default React.memo((props: { data: PortfolioItem[] }) => {
  const data = props.data;
  const headers = ['Pool', 'Balance'];

  const hasDescription = data.some(
    (v: any) => v.detail.description !== undefined
  );
  const hasRewardTokenList = data.some(
    (v: any) => v.detail.reward_token_list !== undefined
  );

  if (hasRewardTokenList) headers.push('Rewards');
  if (hasDescription) headers.unshift('');

  headers.push('USD Value');

  return (
    <Panel>
      <Table>
        <Table.Header headers={headers} />
        <Table.Body>
          {data.map((p: any) => {
            const nfts = sortBy(
              polyNfts(p.detail.supply_nft_list ?? []),
              (v) => v.amount || 0
            ).reverse();
            return (
              <Table.Row>
                {hasDescription && (
                  <Value.String value={p.detail.description} />
                )}
                <Value.Tokens value={p.detail.supply_token_list} nfts={nfts} />
                <Value.BlancesWithNfts
                  tokens={p.detail.supply_token_list}
                  nfts={nfts}
                />
                {hasRewardTokenList && (
                  <Value.ClaimableTokens
                    value={
                      Array.isArray(p.detail.reward_token_list)
                        ? p.detail.reward_token_list
                        : [p.detail.reward_token_list]
                    }
                  />
                )}
                <Table.Col>
                  {formatUsdValue(p.stats.net_usd_value)}
                  {!!nfts.length && (
                    <Tooltip title="NFT value not included.">
                      <img
                        src={IconNftUsdInfo}
                        style={{ marginLeft: 4, width: 10, height: 10 }}
                      />
                    </Tooltip>
                  )}
                </Table.Col>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </Panel>
  );
});
