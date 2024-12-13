import { useCallback, useEffect } from 'react';
import styled from 'styled-components';

import { useSetSettingVisible, useSettingVisible } from '../hooks';
import { RabbyFeePopup } from '../../Swap/component/RabbyFeePopup';

export const Header = () => {
  const feePopupVisible = useSettingVisible();
  const setFeePopupVisible = useSetSettingVisible();

  const closeFeePopup = useCallback(() => {
    setFeePopupVisible(false);
  }, [setFeePopupVisible]);

  const Wrapper = styled.div`
    --max-width: 1080px;
    width: var(--max-width);
    position: absolute;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 16px;
    color: white;
    z-index: -1;
    .title {
      font-size: 28px;
      font-weight: medium;
    }
  `;

  return (
    <>
      <Wrapper>
        <div className="title">Bridge</div>
      </Wrapper>
      <RabbyFeePopup
        type="bridge"
        visible={feePopupVisible}
        onClose={closeFeePopup}
      />
    </>
  );
};
