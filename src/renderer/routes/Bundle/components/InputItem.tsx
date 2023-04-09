import RabbyInput from '@/renderer/components/AntdOverwrite/Input';
import React from 'react';
import { InputProps } from 'antd';
import clsx from 'clsx';

export const InputItem: React.FC<InputProps> = (props) => {
  return (
    <RabbyInput
      placeholder="Please input Address"
      className={clsx(
        'py-[15px] px-[24px] rounded-[8px]',
        'bg-white bg-opacity-10 border border-[#FFFFFF1A] rounded-[4px]',
        'text-[15px] leading-[18px] text-white'
      )}
      autoFocus
      {...props}
    />
  );
};
