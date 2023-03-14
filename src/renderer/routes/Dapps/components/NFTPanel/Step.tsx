import { Button } from 'antd';
import classNames from 'classnames';
import React from 'react';

export interface Props {
  no: number;
  title: string;
  buttonText: string;
  onButtonClick: () => void;
}

export const Step: React.FC<Props> = ({
  title,
  buttonText,
  onButtonClick,
  no,
}) => {
  return (
    <div
      className={classNames('w-[126px] flex flex-col text-white text-center')}
    >
      <i className={classNames('mb-[5px]', 'opacity-20 text-[16px]')}>
        <span>{no}</span>
      </i>
      <h2
        className={classNames(
          'mb-[20px]',
          'text-white text-[15px] leading-[18px] font-bold'
        )}
      >
        {title}
      </h2>
      <Button
        className="w-[94px] h-[33px] mx-auto"
        type="primary"
        onClick={onButtonClick}
      >
        {buttonText}
      </Button>
    </div>
  );
};
