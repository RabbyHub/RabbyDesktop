import React from 'react';
import styles from './MainRoute.module.less';

export default function MainWindowMain({
  children,
}: React.PropsWithChildren<object>) {
  return <div className={styles.Main}>{children}</div>;
}
