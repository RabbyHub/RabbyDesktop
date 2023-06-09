import { useBundle } from '@/renderer/hooks/useBundle/useBundle';
import React from 'react';
import { toastMaxAccount } from '@/renderer/hooks/useBundle/util';
import { AccountItem } from './AccountItem';
import { CommonAccountList } from './CommonAccountList';
import { AddOKXModal } from './AddOKXModal';

const MAX_ACCOUNT = 3;

export const OKXAccountList = () => {
  const {
    account: { okxList, preCheckMaxAccount },
  } = useBundle();
  const list = okxList.filter((item) => !item.inBundle);
  const [openModal, setOpenModal] = React.useState(false);

  const onClickAdd = React.useCallback(() => {
    if (okxList.length >= MAX_ACCOUNT) {
      toastMaxAccount();
      return;
    }

    if (preCheckMaxAccount()) {
      setOpenModal(true);
    }
  }, [okxList.length, preCheckMaxAccount]);

  return (
    <>
      <CommonAccountList
        maxAccount={MAX_ACCOUNT}
        canAdd
        onClickAdd={onClickAdd}
        title="OKX Account"
        hoverTips="Add account"
        clickTips="Maximum 3 OKX account"
      >
        {list.map((item) => (
          <AccountItem canDelete canEdit key={item.id} data={item} />
        ))}
      </CommonAccountList>
      <AddOKXModal open={openModal} onCancel={() => setOpenModal(false)} />
    </>
  );
};
