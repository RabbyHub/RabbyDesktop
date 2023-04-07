import { useBundle } from '@/renderer/hooks/useBundle/useBundle';
import React from 'react';

export const HomeBundle = () => {
  const { binance, account, eth } = useBundle();

  console.log('account', account);
  console.log('binance', binance);
  console.log('eth', eth);

  return (
    <div>
      <h1>Bundles Page</h1>
      <div>{binance.balance}</div>
      {account.ethList.map((item) => {
        return (
          <div>
            <div>{item.data.address}</div>
            <div>{item.balance}</div>
            <button type="button" onClick={() => account.create(item)}>
              add
            </button>
          </div>
        );
      })}
    </div>
  );
};
