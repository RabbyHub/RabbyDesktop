import { useCallback, useEffect, useState } from 'react';
import { useZPopupLayerOnMain } from '@/renderer/hooks/usePopupWinOnMainwin';
import { useAddressManagement } from '@/renderer/hooks/rabbyx/useAddressManagement';
import { forwardMessageTo } from '@/renderer/hooks/useViewsMessage';
import { KEYRING_TYPE } from '@/renderer/utils/constant';
import { DisplayedAccount } from './hooks';
import { AccountItem } from '../AccountItem';

export const AccountList = ({
  list,
  updateIndex,
}: {
  list?: DisplayedAccount[];
  updateIndex: (b: boolean) => void;
}) => {
  const { getHighlightedAddressesAsync, removeAddress } =
    useAddressManagement();
  const [selectedAccount, setSelectedAccount] =
    useState<IDisplayedAccountWithBalance>();
  const zActions = useZPopupLayerOnMain();

  useEffect(() => {
    if (selectedAccount) {
      zActions.showZSubview('address-detail', {
        account: selectedAccount,
        backable: true,
      });
      zActions.hideZSubview('address-management');

      setSelectedAccount(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount]);

  const Row = useCallback(
    (props: { data: DisplayedAccount[]; index: number }) => {
      const { data, index } = props;
      const account = data[index];

      const onDelete = async () => {
        await removeAddress([account.address, account.type, account.brandName]);
        getHighlightedAddressesAsync();

        forwardMessageTo('main-window', 'on-deleted-account', {});
        updateIndex(
          data.length === 1 && account.type !== KEYRING_TYPE.HdKeyring
        );
      };

      return (
        <AccountItem
          account={account}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedAccount(account);
          }}
          onClickDelete={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          isUpdatingBalance={false}
        />
      );
    },
    [getHighlightedAddressesAsync, removeAddress, updateIndex]
  );
  if (!list || !list.length) {
    return null;
  }
  return (
    <div className="-mx-20">
      {list.map((item, index) => (
        <Row data={list} index={index} key={item.address} />
      ))}
    </div>
  );
};
