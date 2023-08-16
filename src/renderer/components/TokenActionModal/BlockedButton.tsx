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
    background-color: #ec5151;
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

export const BlockedButton: React.FC<Props> = ({
  selected,
  onOpen,
  onClose,
}) => {
  return (
    <div
      className={clsx('flex rounded', {
        'py-[9px] px-8 bg-orange bg-opacity-20 justify-between -mt-10 mb-20 -mr-4':
          selected,
        'float-right justify-end': !selected,
      })}
    >
      <div
        className={clsx(
          'text-orange ml-4 text-13',
          selected ? 'block' : 'hidden'
        )}
      >
        Blocked token will not be shown in token list
      </div>
      <div
        className={clsx('flex items-center gap-x-[6px] cursor-pointer', {
          'mr-4 mt-2': !selected,
        })}
      >
        <SwitchStyled
          size="small"
          checked={selected}
          onChange={(val, e) => {
            e.stopPropagation();
            e.preventDefault();
            if (val) {
              onOpen();
            } else {
              onClose();
            }
          }}
        />
        <span className="text-[#BABEC5] text-12">Blocked</span>
      </div>
    </div>
  );
};
