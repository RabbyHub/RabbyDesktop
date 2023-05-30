import { useLedgerDeviceConnected } from '@/renderer/utils/ledger';
import React from 'react';
import { useCommonPopupView } from './useCommonPopupView';

export const Ledger: React.FC = () => {
  const { setTitle, setHeight, closePopup } = useCommonPopupView();
  const hasConnectedLedgerHID = useLedgerDeviceConnected();

  React.useEffect(() => {
    setTitle('How to Connect Ledger');
    setHeight(360);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (hasConnectedLedgerHID) {
      closePopup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasConnectedLedgerHID]);

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
    </div>
  );
};
