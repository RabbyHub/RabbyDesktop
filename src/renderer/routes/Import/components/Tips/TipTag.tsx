import styles from './Tips.module.less';

const TipTag = () => {
  return (
    <div className={styles.TipTag}>
      <div className={styles.container}>
        <img src="rabby-internal://assets/icons/import/tip.svg" alt="tip" />
        <span className={styles.label}>Tips</span>
      </div>
    </div>
  );
};
export default TipTag;
