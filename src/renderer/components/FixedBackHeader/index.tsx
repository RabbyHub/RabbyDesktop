import IconSwapBack from '@/../assets/icons/swap/back.svg?rc';
import { ComponentPropsWithoutRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const StyledDiv = styled.div`
  position: absolute;
  left: 32px;
  top: 12px;
  display: flex;
  gap: 28px;
  align-items: center;
  font-weight: 500;
  font-size: 28px;
  color: #fff;

  & > .back {
    cursor: pointer;
  }
`;

export const FixedBackHeader = ({
  children,
  ...other
}: ComponentPropsWithoutRef<typeof StyledDiv>) => {
  const navigate = useNavigate();
  const goBack2 = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return (
    <StyledDiv {...other}>
      <IconSwapBack onClick={goBack2} className="back" />
      <div>{children}</div>
    </StyledDiv>
  );
};
