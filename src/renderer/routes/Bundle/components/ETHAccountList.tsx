import { useBundle } from '@/renderer/hooks/useBundle/useBundle';
import { useZPopupLayerOnMain } from '@/renderer/hooks/usePopupWinOnMainwin';
import { AccountItem } from './AccountItem';
import { CommonAccountList } from './CommonAccountList';

export const ETHAccountList = () => {
  const { account } = useBundle();
  const list = account.ethList.filter((item) => !item.inBundle);
  const zActions = useZPopupLayerOnMain();

  return (
    <CommonAccountList
      canAdd
      onClickAdd={() => {
        zActions.showZSubview('select-add-address-type-modal');
      }}
      title="Imported wallet account"
    >
      {list.map((item) => (
        <AccountItem canDelete canEdit key={item.id} data={item} />
      ))}
    </CommonAccountList>
  );
};
