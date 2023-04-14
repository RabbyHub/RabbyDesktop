import {
  IDisplayedAccountWithBalance,
  useAccountToDisplay,
} from '@/renderer/hooks/rabbyx/useAccountToDisplay';
import { useAddressManagement } from '@/renderer/hooks/rabbyx/useAddressManagement';
import { useZPopupViewState } from '@/renderer/hooks/usePopupWinOnMainwin';
import { forwardMessageTo } from '@/renderer/hooks/useViewsMessage';
import React from 'react';
import { Modal } from '../Modal/Modal';
import { AccountDetail } from './AccountDetail';

export const AddressDetailModal: React.FC = () => {
  const { svVisible, svState, closeSubview } =
    useZPopupViewState('address-detail');
  const { getHighlightedAddressesAsync, removeAddress } =
    useAddressManagement();
  const { updateBalance } = useAccountToDisplay();
  const [balance, setBalance] = React.useState(svState?.account?.balance);

  const back = React.useCallback(() => {
    closeSubview();
  }, [closeSubview]);

  const handleDelete = React.useCallback(
    async (account: IDisplayedAccountWithBalance) => {
      await removeAddress([account.address, account.type, account.brandName]);
      getHighlightedAddressesAsync();
      forwardMessageTo('main-window', 'on-deleted-account', {});

      closeSubview();
    },
    [removeAddress, getHighlightedAddressesAsync, closeSubview]
  );

  React.useEffect(() => {
    if (svState?.account?.address) {
      updateBalance(svState?.account?.address).then(setBalance);
    }
  }, [svState?.account, updateBalance]);

  if (!svVisible || !svState?.account) return null;

  return (
    <Modal
      centered
      smallTitle
      width={520}
      title="Address Detail"
      onCancel={closeSubview}
      open={svVisible}
      onBack={back}
    >
      <AccountDetail
        onClose={closeSubview}
        onDelete={handleDelete}
        account={{
          ...svState.account,
          balance: balance ?? 0,
        }}
      />
    </Modal>
  );
};
