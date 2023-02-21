import { Switch as AntSwitch, SwitchProps } from 'antd';
import styled from 'styled-components';

const StyledSwitch = styled(AntSwitch)`
  &.ant-switch {
    min-width: 32px;
    background-color: rgba(180, 189, 204, 0.5);
    &:focus,
    &:hover {
      box-shadow: none;
    }
    &.ant-switch-checked {
      background: #27c193;
      &:focus,
      &:hover {
        box-shadow: none;
      }

      .ant-switch-handle::before {
        background-color: #fff;
      }
    }
    .ant-click-animating-node {
      display: none;
    }

    .ant-switch-handle::before {
      background-color: #d0d5df;
    }
  }
`;

export const Switch = (props: SwitchProps) => {
  return <StyledSwitch size="small" {...props} />;
};
