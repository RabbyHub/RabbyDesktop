import { useBundle } from '@/renderer/hooks/useBundle/useBundle';
import React from 'react';
import { toastMaxAccount } from '@/renderer/hooks/useBundle/util';
import { AccountItem } from './AccountItem';
import { CommonAccountList } from './CommonAccountList';
import { AddBinanceModal } from './AddBinanceModal';

const MAX_ACCOUNT = 3;

export const BinanceAccountList = () => {
  const {
    account: { binanceList, preCheckMaxAccount },
  } = useBundle();
  const list = binanceList.filter((item) => !item.inBundle);
  const [openModal, setOpenModal] = React.useState(false);

  const onClickAdd = React.useCallback(() => {
    if (binanceList.length >= MAX_ACCOUNT) {
      toastMaxAccount();
      return;
    }

    if (preCheckMaxAccount()) {
      setOpenModal(true);
    }
  }, [binanceList.length, preCheckMaxAccount]);

  return (
    <>
      <CommonAccountList
        maxAccount={MAX_ACCOUNT}
        canAdd
        onClickAdd={onClickAdd}
        title="Binance Account"
        hoverTips="Add account"
        clickTips="Maximum 3 Binance account"
      >
        {list.map((item) => (
          <AccountItem canDelete canEdit key={item.id} data={item} />
        ))}
      </CommonAccountList>
      <AddBinanceModal open={openModal} onCancel={() => setOpenModal(false)} />
    </>
  );
};
