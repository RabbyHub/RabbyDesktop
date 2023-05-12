import { useAccounts } from '@/renderer/hooks/rabbyx/useAccount';
import { useEffect } from 'react';
import styles from './index.module.less';

export default function MainWindowLoading() {
  const { fetchAccounts } = useAccounts();

  useEffect(() => {
    const timer = setInterval(() => {
      fetchAccounts();
    }, 1500);

    return () => {
      clearInterval(timer);
    };
  }, [fetchAccounts]);

  return <div className={styles.pageLoading} />;
}
