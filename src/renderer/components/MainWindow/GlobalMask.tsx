import classNames from 'classnames';
import styles from './GlobalMask.module.less';

export default function GlobalMask({ className = '' }: { className?: string }) {
  return <div className={classNames(styles.globalMask, className)} />;
}
