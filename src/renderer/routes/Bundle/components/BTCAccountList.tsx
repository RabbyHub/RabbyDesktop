import { useBundle } from '@/renderer/hooks/useBundle/useBundle';
import { AccountItem } from './AccountItem';
import { CommonAccountList } from './CommonAccountList';

export const BTCAccountList = () => {
  const { account } = useBundle();

  return (
    <CommonAccountList title="BTC 地址">
      {account.btcList.map((item) => (
        <AccountItem key={item.id} data={item} />
      ))}
    </CommonAccountList>
  );
};
