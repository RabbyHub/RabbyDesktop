import { useBundle } from '@/renderer/hooks/useBundle/useBundle';
import { AccountItem } from './AccountItem';
import { CommonAccountList } from './CommonAccountList';

export const BundleAccountList = () => {
  const { account } = useBundle();

  return (
    <CommonAccountList
      isBundle
      titleClassName="mb-[20px] opacity-70"
      title={`Bundle Addresses (${account.inBundleList.length})`}
    >
      {account.inBundleList.map((item) => (
        <AccountItem isBundle key={item.id} checked data={item} />
      ))}
    </CommonAccountList>
  );
};
