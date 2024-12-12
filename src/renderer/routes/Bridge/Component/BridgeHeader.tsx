import { useCallback, useEffect } from 'react';
import { useSetSettingVisible, useSettingVisible } from '../hooks';
import { RabbyFeePopup } from '../../Swap/component/RabbyFeePopup';

export const Header = () => {
  const feePopupVisible = useSettingVisible();
  const setFeePopupVisible = useSetSettingVisible();

  const closeFeePopup = useCallback(() => {
    setFeePopupVisible(false);
  }, [setFeePopupVisible]);

  return (
    <RabbyFeePopup
      type="bridge"
      visible={feePopupVisible}
      onClose={closeFeePopup}
    />
  );
};
