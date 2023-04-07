import { useBundle } from '@/renderer/hooks/useBundle/useBundle';
import { AccountItem } from './AccountItem';
import { CommonAccountList } from './CommonAccountList';

export const BinanceAccountList = () => {
  const { account } = useBundle();

  return (
    <CommonAccountList title="Binance Key">
      {account.binanceList.map((item) => (
        <AccountItem key={item.id} data={item} />
      ))}
    </CommonAccountList>
  );
};
