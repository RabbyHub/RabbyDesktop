import classNames from 'classnames';
import React from 'react';
import styles from './GlobalMask.module.less';

export default function GlobalMask({
  className = '',
  onClick,
}: React.PropsWithChildren<
  React.HTMLProps<HTMLDivElement> & { className?: string }
>) {
  return (
    <div
      onClick={onClick}
      className={classNames(styles.globalMask, className)}
    />
  );
}
