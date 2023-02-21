import { IDisplayedAccountWithBalance } from '@/renderer/hooks/rabbyx/useAccountToDisplay';
import { useAddressManagement } from '@/renderer/hooks/rabbyx/useAddressManagement';
import { useZPopupViewState } from '@/renderer/hooks/usePopupWinOnMainwin';
import React from 'react';
import { Modal } from '../Modal/Modal';
import { AccountDetail } from './AccountDetail';

export const AddressDetailModal: React.FC = () => {
  const { svVisible, svState, closeSubview } =
    useZPopupViewState('address-detail');
  const { getHighlightedAddressesAsync, removeAddress } =
    useAddressManagement();

  const handleDelete = React.useCallback(
    async (account: IDisplayedAccountWithBalance) => {
      await removeAddress([account.address, account.type, account.brandName]);
      getHighlightedAddressesAsync();
      closeSubview();
    },
    [removeAddress, getHighlightedAddressesAsync, closeSubview]
  );

  if (!svVisible || !svState?.account) return null;

  return (
    <Modal
      centered
      smallTitle
      width={520}
      title="Address Detail"
      onCancel={closeSubview}
      open={svVisible}
      backable={svState.backable}
      onBack={closeSubview}
    >
      <AccountDetail
        onClose={closeSubview}
        onDelete={handleDelete}
        account={svState.account}
      />
    </Modal>
  );
};
