import clsx from 'clsx';
import React from 'react';
import styles from './index.module.less';

export interface Props {
  logo: string;
  title: string;
  subtitle?: string;
  onAction: () => void;
}

export const ContactTypeCard: React.FC<Props> = ({
  logo,
  title,
  subtitle,
  onAction,
}) => {
  return (
    <div className={clsx(styles.panel, styles.panelContact)} onClick={onAction}>
      <div className={styles.logo}>
        <img className="w-[32px] h-[32px]" src={logo} />
      </div>
      <div className={styles.content}>
        <span className={styles.title}>{title}</span>
        {subtitle ? (
          <span className={styles.subtitle}>
            You can also use it as a watch-only address
          </span>
        ) : null}
      </div>
      <div className={styles.action}>
        <img src="rabby-internal://assets/icons/add-address/arrow-right.svg" />
      </div>
    </div>
  );
};
