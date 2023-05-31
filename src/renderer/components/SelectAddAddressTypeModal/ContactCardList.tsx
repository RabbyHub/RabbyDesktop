import clsx from 'clsx';
import React from 'react';
import styles from './index.module.less';

export interface Props {
  logo: string;
  title: string;
  list: {
    logo: string;
    bridge?: string;
    name: string;
    id: string;
  }[];
  onAction: (id: string) => void;
}

export const ContactTypeCardList: React.FC<Props> = ({
  logo,
  list,
  title,
  onAction,
}) => {
  return (
    <div className={clsx(styles.panel, styles.panelHD)}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <img src={logo} />
        </div>
        <span className={styles.title}>{title}</span>
      </div>
      <div className={clsx(styles.body, 'gap-x-[10px] gap-y-[5px]')}>
        {list.map((item) => (
          <div
            onClick={() => {
              onAction(item.id);
            }}
            className={styles.device}
          >
            <div className={styles.deviceLogo}>
              <img width="100%" src={item.logo} />
              {item.bridge && (
                <img
                  className="absolute -bottom-[3px] -right-[3px] w-[14px]"
                  src={item.bridge}
                />
              )}
            </div>
            <span className={styles.deviceName}>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
