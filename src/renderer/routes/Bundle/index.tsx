import { useBundle } from '@/renderer/hooks/useBundle/useBundle';
import React from 'react';

export const HomeBundle = () => {
  const { binance } = useBundle();

  return (
    <div>
      <h1>Bundles Page</h1>
      <div>{binance.balance}</div>
    </div>
  );
};
