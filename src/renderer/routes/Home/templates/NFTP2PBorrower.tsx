import React from 'react';
import { PortfolioItem } from '@rabby-wallet/rabby-api/dist/types';
import Panel from '../components/Panel';
import * as Value from '../components/Value';

export default React.memo((props: { data: PortfolioItem[] }) => {
  const data = props.data;

  return (
    <>
      {data.map((p: any) => {
        return (
          <Panel>
            <Value.NFTTable name="Supplied" tokens={p.detail.supply_nft_list} />
            <Value.TokenTable
              name="Borrowed"
              tokens={p.detail.borrow_token_list}
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
