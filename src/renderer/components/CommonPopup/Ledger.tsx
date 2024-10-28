import React from 'react';
import { useLedgerDeviceConnected } from '@/renderer/utils/ledger';
import { useZPopupLayerOnMain } from '@/renderer/hooks/usePopupWinOnMainwin';
import { useCommonPopupView } from './useCommonPopupView';

export const Ledger: React.FC<{
  isModalContent?: boolean;
}> = ({ isModalContent }) => {
  const { setTitle, setHeight, closePopup } = useCommonPopupView();
  const hasConnectedLedgerHID = useLedgerDeviceConnected();
  const { showZSubview } = useZPopupLayerOnMain();

  React.useEffect(() => {
    if (!isModalContent) {
      setTitle('Your ledger is not connected');
      setHeight(320);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!isModalContent]);

  React.useEffect(() => {
    if (!isModalContent && hasConnectedLedgerHID) {
      closePopup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasConnectedLedgerHID, !isModalContent]);

  const handleClick = async () => {
    if (!isModalContent) {
      // await rejectApproval(t('page.dashboard.hd.userRejectedTheRequest'), true);
      // openInternalPageInTab('request-permission?type=ledger&from=approval');
      showZSubview('add-address-modal', {
        keyringType: 'Ledger Hardware',
        brand: undefined,
        showEntryButton: false,
        showBackButton: true,
      });
    } else {
      showZSubview('add-address-modal', {
        keyringType: 'Ledger Hardware',
        brand: undefined,
        showEntryButton: false,
        showBackButton: true,
      });
    }
  };

  return (
    <div className="pt-[10px]">
      <ul className="list-decimal w-[180px] pl-[20px] m-auto text-white text-[15px] leading-[22px]">
        <li>Plug in a single Ledger</li>
        <li>Enter pin to unlock</li>
        <li>Open Ethereum App</li>
      </ul>
      <img
        src="rabby-internal://assets/imgs/ledger/ledger-plug.svg"
        className="w-[295px] mt-[32px] mx-auto block"
      />
      <div className="mt-[24px] text-13 text-r-neutral-body text-center">
        If it doesn't work, try&nbsp;
        <span className="underline cursor-pointer" onClick={handleClick}>
          reconnecting from the beginning.
        </span>
      </div>
    </div>
  );
};
