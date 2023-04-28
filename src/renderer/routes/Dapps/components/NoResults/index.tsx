import styles from './index.module.less';

export const NoResults = () => {
  return (
    <div className={styles.empty}>
      <img src="rabby-internal://assets/icons/dapps/icon-empty.svg" alt="" />
      <div className={styles.emptyText}>No results</div>
    </div>
  );
};
