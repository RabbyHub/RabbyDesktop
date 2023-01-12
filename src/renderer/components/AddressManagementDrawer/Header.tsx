import React from 'react';
import styles from './AddressManagementDrawer.module.less';

export const Header: React.FC = () => {
  return (
    <section className={styles.header}>
      <div>current account</div>
      <div className={styles.divider}>
        <span className={styles.text}>switch address</span>
      </div>
    </section>
  );
};
