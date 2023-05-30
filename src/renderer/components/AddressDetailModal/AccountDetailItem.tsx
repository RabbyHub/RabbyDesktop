import clsx from 'clsx';
import React from 'react';
import styles from './index.module.less';

export interface Props extends React.HTMLProps<HTMLDivElement> {
  headline: React.ReactNode;
  description?: React.ReactNode;
  details?: React.ReactNode;
  append?: React.ReactNode;
}

export const AccountDetailItem: React.FC<Props> = ({
  headline,
  description,
  children,
  className,
  details,
  append,
  ...attrs
}) => {
  return (
    <div {...attrs} className={clsx(styles.AccountDetailItem, className)}>
      <div className="flex items-center justify-between h-[56px]">
        <div className={styles.headline}>
          <div className={styles.title}>{headline}</div>
          <div className={styles.description}>{description}</div>
          <div>{details}</div>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
      {append}
    </div>
  );
};
