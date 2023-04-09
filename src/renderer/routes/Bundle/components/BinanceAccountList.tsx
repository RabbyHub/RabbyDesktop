import { useBundle } from '@/renderer/hooks/useBundle/useBundle';
import { AccountItem } from './AccountItem';
import { CommonAccountList } from './CommonAccountList';

export const BinanceAccountList = () => {
  const { account } = useBundle();
  const list = account.binanceList.filter((item) => !item.inBundle);

  return (
    <CommonAccountList canAdd title="Binance Account">
      {list.map((item) => (
        <AccountItem canDelete canEdit key={item.id} data={item} />
      ))}
    </CommonAccountList>
  );
};
