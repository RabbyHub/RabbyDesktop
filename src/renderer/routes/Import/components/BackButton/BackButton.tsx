import classNames from 'classnames';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './BackButton.module.less';

const BackButton: React.FC<React.HtmlHTMLAttributes<HTMLDivElement>> = ({
  className,
  onClick,
  ...attrs
}) => {
  const nav = useNavigate();
  return (
    <div
      {...attrs}
      onClick={(e) => {
        nav(-1);
        onClick?.(e);
      }}
      className={classNames(styles.BackButton, className)}
    >
      <img src="rabby-internal://assets/icons/import/back.svg" alt="back" />
    </div>
  );
};

export default BackButton;
