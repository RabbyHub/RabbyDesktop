import React from 'react';
import style from './index.module.less';

export const AutoUpdate = () => {
  const [isUpdateAvailable, setIsUpdateAvailable] = React.useState(false);

  if (!isUpdateAvailable) {
    return null;
  }
  return (
    <div className={style.autoUpdate}>
      <div className="auto-update is-downloading">
        <img
          src="rabby-internal://assets/icons/internal-homepage/icon-update-loading.svg"
          className="auto-update-icon animate"
          alt=""
        />
        <div className="auto-update-content">
          Update Rabby Wallet Desktop. The new version 0.2 is available.{' '}
        </div>
        <div className="auto-update-action">
          <a href="#/">Download</a>
        </div>
      </div>
    </div>
  );
};
