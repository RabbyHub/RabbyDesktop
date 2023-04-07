import { useBundle } from '@/renderer/hooks/useBundle/useBundle';
import { AccountItem } from './AccountItem';
import { CommonAccountList } from './CommonAccountList';

export const ETHAccountList = () => {
  const { account } = useBundle();

  return (
    <CommonAccountList title="已导入钱包地址">
      {account.ethList.map((item) => (
        <AccountItem key={item.id} data={item} />
      ))}
    </CommonAccountList>
  );
};
