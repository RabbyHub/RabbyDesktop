import { PortfolioItem } from '@rabby-wallet/rabby-api/dist/types';
import React from 'react';
import Panel from '../components/Panel';
import * as Value from '../components/Value';

export default React.memo((props: { data: PortfolioItem[] }) => {
  const data = props.data;

  return (
    <>
      {data.map((p: any) => {
        return (
          <Panel>
            <Value.NFTTable name="Lent against" tokens={p.detail.nft_list} />
            <Value.TokenTable
              name="Supplied"
              tokens={p.detail.supply_token_list}
            />
            <Value.TokenTable
              name="Rewards"
              tokens={p.detail.reward_token_list}
            />
          </Panel>
        );
      })}
    </>
  );
});
