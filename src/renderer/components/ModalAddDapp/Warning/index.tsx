import { ReactNode } from 'react';
import styles from './index.module.less';

interface Props {
  children?: ReactNode;
}
export const Warning = ({ children }: Props) => {
  return (
    <div className={styles.container}>
      <div>
        <img
          className={styles.icon}
          src="rabby-internal://assets/icons/add-dapp/icon-warning.svg"
          alt=""
        />
        <div className={styles.text}>{children}</div>
      </div>
    </div>
  );
};
