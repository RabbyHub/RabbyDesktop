import { useBundle } from '@/renderer/hooks/useBundle/useBundle';
import React from 'react';
import { toastMessage } from '@/renderer/components/TransparentToast';
import { AccountItem } from './AccountItem';
import { CommonAccountList } from './CommonAccountList';
import { AddBinanceModal } from './AddBinanceModal';

const MAX_ACCOUNT = 3;

export const BinanceAccountList = () => {
  const { account } = useBundle();
  const list = account.binanceList.filter((item) => !item.inBundle);
  const [openModal, setOpenModal] = React.useState(false);

  const onClickAdd = React.useCallback(() => {
    if (list.length >= MAX_ACCOUNT) {
      toastMessage({
        type: 'warning',
        content: 'Maximum address limit reached',
      });
      return;
    }
    setOpenModal(true);
  }, [list.length]);

  return (
    <>
      <CommonAccountList
        maxAccount={MAX_ACCOUNT}
        canAdd
        onClickAdd={onClickAdd}
        title="Binance Account"
      >
        {list.map((item) => (
          <AccountItem canDelete canEdit key={item.id} data={item} />
        ))}
      </CommonAccountList>
      <AddBinanceModal open={openModal} onCancel={() => setOpenModal(false)} />
    </>
  );
};
