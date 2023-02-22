import { ReactNode } from 'react';
import styled from 'styled-components';

const PanelWrapper = styled.div`
  padding: 0 22px;
  margin-bottom: 14px;
  position: relative;
  &::after {
    content: '';
    display: block;
    position: absolute;
    bottom: 0;
    width: 95%;
    left: 50%;
    transform: translateX(-50%);
    height: 1px;
    background-color: rgba(255, 255, 255, 0.06);
  }
  &:nth-last-child(1) {
    margin-bottom: 0;
    &::after {
      display: none;
    }
  }
`;

const Panel = ({ children }: { children: ReactNode }) => {
  return <PanelWrapper>{children}</PanelWrapper>;
};

export default Panel;
