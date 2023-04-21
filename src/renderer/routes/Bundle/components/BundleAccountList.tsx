import { useBundle } from '@/renderer/hooks/useBundle/useBundle';
import { AccountItem } from './AccountItem';
import { CommonAccountList } from './CommonAccountList';

export const BundleAccountList = () => {
  const { account } = useBundle();

  return (
    <CommonAccountList
      isBundle
      titleClassName="mb-[8px] opacity-70 leading-none"
      title={`Bundle Addresses (${account.inBundleList.length})`}
      maxAccount={15}
    >
      {account.inBundleList.map((item) => (
        <AccountItem isBundle key={item.id} checked data={item} />
      ))}
    </CommonAccountList>
  );
};
