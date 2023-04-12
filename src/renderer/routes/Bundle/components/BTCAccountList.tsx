import { useBundle } from '@/renderer/hooks/useBundle/useBundle';
import React from 'react';
import { AccountItem } from './AccountItem';
import { CommonAccountList } from './CommonAccountList';
import { AddBTCModal } from './AddBTCModal';

export const BTCAccountList = () => {
  const {
    account: { preCheckMaxAccount, btcList },
  } = useBundle();
  const list = btcList.filter((item) => !item.inBundle);
  const [openModal, setOpenModal] = React.useState(false);

  const onOpenModal = React.useCallback(() => {
    if (preCheckMaxAccount()) {
      setOpenModal(false);
    }
  }, [preCheckMaxAccount]);

  return (
    <>
      <CommonAccountList
        onClickAdd={() => setOpenModal(true)}
        canAdd
        title="BTC Address"
      >
        {list.map((item) => (
          <AccountItem canDelete canEdit key={item.id} data={item} />
        ))}
      </CommonAccountList>
      <AddBTCModal open={openModal} onCancel={onOpenModal} />
    </>
  );
};
