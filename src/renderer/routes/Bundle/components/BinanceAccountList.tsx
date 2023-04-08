import { useBundle } from '@/renderer/hooks/useBundle/useBundle';
import { AccountItem } from './AccountItem';
import { CommonAccountList } from './CommonAccountList';

export const BinanceAccountList = () => {
  const { account } = useBundle();
  const list = account.binanceList.filter((item) => !item.inBundle);

  return (
    <CommonAccountList title="Binance Account">
      {list.map((item) => (
        <AccountItem key={item.id} data={item} />
      ))}
    </CommonAccountList>
  );
};
