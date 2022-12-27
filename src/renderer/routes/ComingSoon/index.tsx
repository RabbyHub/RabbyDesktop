import styles from './index.module.less';

export default function ComingSoon({ pageName = '' }: { pageName?: string }) {
  return (
    <div className={styles.comingSoon}>
      {pageName && <span className={styles.pageName}>{pageName}&nbsp;</span>}
      Coming Soon 🕐
    </div>
  );
}
