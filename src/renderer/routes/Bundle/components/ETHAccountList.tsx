import { useBundle } from '@/renderer/hooks/useBundle/useBundle';
import { AccountItem } from './AccountItem';
import { CommonAccountList } from './CommonAccountList';

export const ETHAccountList = () => {
  const { account } = useBundle();
  const list = account.ethList.filter((item) => !item.inBundle);

  return (
    <CommonAccountList title="Imported wallet account">
      {list.map((item) => (
        <AccountItem key={item.id} data={item} />
      ))}
    </CommonAccountList>
  );
};
