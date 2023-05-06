import React from 'react';
import clsx from 'clsx';
import { Tooltip } from 'antd';
import styles from './index.module.less';

interface Props {
  loading?: boolean;
  onClick?: () => void;
}

export const RefreshButton: React.FC<Props> = ({ loading, onClick }) => {
  const handleClick = React.useCallback(() => {
    if (loading) {
      return;
    }
    onClick?.();
  }, [loading, onClick]);

  return (
    <Tooltip title="Update balance data" placement="left" trigger={['hover']}>
      <div className={styles.refreshButton} onClick={handleClick}>
        {loading ? (
          <div className="w-[20px] h-[20px] flex items-center justify-center">
            <img
              src="rabby-internal://assets/icons/address-management/loading.svg"
              className="w-[16px]"
            />
          </div>
        ) : (
          <img src="rabby-internal://assets/icons/address-management/refresh.svg" />
        )}
      </div>
    </Tooltip>
  );
};
