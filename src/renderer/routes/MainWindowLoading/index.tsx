import { useAccounts } from '@/renderer/hooks/rabbyx/useAccount';
import { useEffect } from 'react';
import { useUnlocked } from '@/renderer/hooks/rabbyx/useUnlocked';
import styles from './index.module.less';

/**
 * @description one intermedia page to fetch accounts and unlocked status
 */
export default function MainWindowLoading() {
  const { fetchUnlocked } = useUnlocked();
  const { fetchAccounts } = useAccounts();

  useEffect(() => {
    const timer = setInterval(() => {
      fetchUnlocked();
      fetchAccounts();
    }, 1500);

    return () => {
      clearInterval(timer);
    };
  }, [fetchAccounts, fetchUnlocked]);

  return <div className={styles.pageLoading} />;
}
