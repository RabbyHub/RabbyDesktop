import classNames from 'classnames';

import { useSystemReleaseInfo } from '@/renderer/hooks/useSystemInfo';
import styles from './index.module.less';

import RcTipIcon from './tip-icon.svg?rc';

export default function TopTipUnsupported({
  className,
}: {
  className?: string;
}) {
  const systemReleaseInfo = useSystemReleaseInfo();

  if (!systemReleaseInfo.isDeprecated) return null;

  return (
    <div className={classNames(styles.TopTipUnsupported, className)}>
      <div className={styles.iconWrapper}>
        <RcTipIcon className={styles.icon} />
      </div>
      <div className={styles.messageWrapper}>
        <div className={styles.title}>
          Your operating system is not supported
        </div>
        <div className={styles.intro}>
          Please install Rabby Wallet on {systemReleaseInfo.aboveText} Stability
          and user experience cannot be guaranteed on other version
        </div>
      </div>
    </div>
  );
}
