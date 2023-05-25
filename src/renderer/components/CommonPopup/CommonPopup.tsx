import React from 'react';
import { SwitchAddress } from './SwitchAddress';
import { SwitchChain } from './SwitchChain';
import { Ledger } from './Ledger';
import { ReconnectView } from '../WalletConnect/ReconnectView';
import { useCommonPopupView } from './useCommonPopupView';
import Popup from '../Popup';

export const CommonPopup: React.FC = () => {
  const { visible, setVisible, title, height, className, componentName } =
    useCommonPopupView();

  return (
    <Popup
      title={<span className="text-[20px] leading-[24px]">{title}</span>}
      closable
      height={height}
      onClose={() => setVisible(false)}
      open={visible && !!componentName}
      className={className}
      destroyOnClose={false}
      getContainer={false}
    >
      {componentName === 'WalletConnect' && <ReconnectView />}
      {componentName === 'SwitchAddress' && <SwitchAddress />}
      {componentName === 'SwitchChain' && <SwitchChain />}
      {componentName === 'Ledger' && <Ledger />}
    </Popup>
  );
};
