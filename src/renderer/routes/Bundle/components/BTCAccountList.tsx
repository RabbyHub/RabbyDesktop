import { useBundle } from '@/renderer/hooks/useBundle/useBundle';
import { AccountItem } from './AccountItem';
import { CommonAccountList } from './CommonAccountList';

export const BTCAccountList = () => {
  const { account } = useBundle();
  const list = account.btcList.filter((item) => !item.inBundle);

  return (
    <CommonAccountList title="BTC Address">
      {list.map((item) => (
        <AccountItem key={item.id} data={item} />
      ))}
    </CommonAccountList>
  );
};
