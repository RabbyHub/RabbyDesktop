import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import IconSwapBack from '@/../assets/icons/swap/back.svg?rc';
import { SwapByDex } from './swap';

const SwapWrapper = styled.div`
  & > .header {
    position: absolute;
    left: 32px;
    top: 12px;
    display: flex;
    gap: 28px;
    align-items: center;
    font-weight: 500;
    font-size: 28px;
    color: #fff;

    & > svg {
      cursor: pointer;
    }
  }

  & > .content {
    width: 594px;
    margin: auto;
    margin-top: calc(70px - var(--mainwin-headerblock-offset));
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
  }
`;

export const Swap = () => {
  const navigate = useNavigate();
  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);
  return (
    <SwapWrapper>
      <header className="header">
        <IconSwapBack onClick={goBack} />
        <div>Swap</div>
      </header>

      <div className="content">
        <SwapByDex />
      </div>
    </SwapWrapper>
  );
};
