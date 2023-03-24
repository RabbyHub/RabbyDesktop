import React from 'react';
import { Button as AntdButton, ButtonProps } from 'antd';
import classNames from 'classnames';

export const RabbyButton: React.FC<ButtonProps> = (props) => {
  const { className, ...rest } = props;
  return (
    <AntdButton
      prefixCls="rabby-button"
      type="primary"
      className={classNames(
        'w-[172px] text-[13px] h-[34px] rounded-[4px]',
        'bg-color-[#8697FF] outline-none border-none cursor-pointer shadow',
        'text-white',
        'hover:bg-opacity-80',
        {
          // eslint-disable-next-line react/destructuring-assignment
          'opacity-30 cursor-not-allowed': props.disabled || props.loading,
        },
        className
      )}
      {...rest}
    />
  );
};
