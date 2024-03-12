import { Switch } from 'antd';
import clsx from 'clsx';
import React from 'react';
import styled from 'styled-components';

export interface Props {
  selected?: boolean;
  onOpen(): void;
  onClose(): void;
}

const SwitchStyled = styled(Switch)`
  box-shadow: none !important;

  &.ant-switch-checked {
    background-color: #2abb7f;
  }

  &.ant-switch-small {
    min-width: 24px;
    height: 12px;
    line-height: 12px;
  }

  &.ant-switch-small .ant-switch-handle {
    width: 10px;
    height: 10px;
    top: 1px;
    left: 1px;
  }

  &.ant-switch-small.ant-switch-checked .ant-switch-handle {
    left: 13px;
  }
`;

export const CustomizedButton: React.FC<Props> = ({
  selected,
  onOpen,
  onClose,
}) => {
  return (
    <div
      className={clsx(
        'flex rounded',
        'py-[9px] px-12 bg-orange bg-opacity-20 justify-between mb-[20px]'
      )}
    >
      <div className={clsx('text-orange text-13')}>
        {selected
          ? `The token is not listed by Rabby. You've added it to the token list manually.`
          : `Token is not listed by Rabby. It will be added to the token list if you switch on.`}
      </div>
      <div className={clsx('flex items-center gap-x-[6px] cursor-pointer')}>
        <SwitchStyled
          size="small"
          checked={selected}
          onChange={(val) => {
            if (val) {
              onOpen();
            } else {
              onClose();
            }
          }}
        />
        <span className="text-[#F7FAFC] text-12">Customized</span>
      </div>
    </div>
  );
};
