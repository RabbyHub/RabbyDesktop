import clsx from 'clsx';
import React from 'react';
import styles from './index.module.less';

export interface Props extends React.HTMLProps<HTMLDivElement> {
  headline: React.ReactNode;
  description?: React.ReactNode;
  details?: React.ReactNode;
}

export const AccountDetailItem: React.FC<Props> = ({
  headline,
  description,
  children,
  className,
  details,
  ...attrs
}) => {
  return (
    <div {...attrs} className={clsx(styles.AccountDetailItem, className)}>
      <div className={styles.headline}>
        <div className={styles.title}>{headline}</div>
        <div className={styles.description}>{description}</div>
        <div>{details}</div>
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
};
