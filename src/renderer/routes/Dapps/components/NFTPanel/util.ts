import { walletController } from '@/renderer/ipcRequest/rabbyx';
import BigNumber from 'bignumber.js';
import React from 'react';

export const useZoraMintFee = () => {
  const [fee, setFee] = React.useState<number>();

  React.useEffect(() => {
    walletController.mintRabbyFee().then((result) => {
      const n = new BigNumber(result).div(1e18).toNumber();
      setFee(n);
    });
  }, []);

  return fee;
};
