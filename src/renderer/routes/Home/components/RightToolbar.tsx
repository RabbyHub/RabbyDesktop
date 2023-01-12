import styled from 'styled-components';

import { IconToolSwap } from '@/../assets/icons/home-widgets';
import { styledId } from '@/renderer/utils/styled';
import { GasketPopupWin } from '@/renderer/components/GasketPopupWin';
import GlobalMask from '@/renderer/components/MainWindow/GlobalMask';
import { usePopupWinInfo } from '@/renderer/hooks/usePopupWinOnMainwin';
import { showMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';

const Tools = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;

  margin-top: 70px;
`;

const ToolbarContainer = styled.div`
  display: flex;
  align-items: center;

  width: 337px;

  ${styledId(Tools)} {
    /* outline: 1px solid #eee; */
  }

  .icon-entry {
    width: 35px;
    height: 35px;
    border-radius: 14px;
    cursor: pointer;

    &:hover {
      background: rgba(105, 126, 255, 0.6);
    }
  }

  .quick-swap-gasket {
    position: absolute;
    top: 64px;
    width: 100%;
    height: 100px;
    /* leave here for tuning position */
    outline: 1px solid blue;
  }
`;

export default function RightToolbar() {
  return (
    <ToolbarContainer>
      <Tools>
        <IconToolSwap
          className="icon-entry"
          onClick={() => {
            showMainwinPopupview(
              { type: 'quick-swap' },
              { openDevTools: false }
            );
          }}
        />
      </Tools>
    </ToolbarContainer>
  );
}
