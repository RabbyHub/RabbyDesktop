import styles from '../index.module.less';

export const Empty = () => (
  <div className={styles.empty}>
    <img
      src="rabby-internal://assets/icons/home/tx-empty.png"
      className={styles.emptyIcon}
    />
    <div className={styles.emptyText}>No Transactions</div>
  </div>
);
