import { Button } from 'antd';
import React from 'react';
import { useAppUpdator } from '../../../../hooks/useAppUpdator';
import style from './index.module.less';

export const AutoUpdate = () => {
  const {
    releaseCheckInfo,
    isDownloading,
    isDownloaded,
    requestDownload
  } = useAppUpdator();

  if (!releaseCheckInfo.hasNewRelease) {
    return null;
  }

  return (
    <div className={style.autoUpdate}>
      <div className="auto-update is-downloading">
        {isDownloading && <span style={{ color: 'yellow' }}>Downloading...</span>}
        {isDownloaded && <span style={{ color: 'green' }}>Downloaded!</span>}
        <img
          src="rabby-internal://assets/icons/internal-homepage/icon-update-loading.svg"
          className="auto-update-icon animate"
          alt=""
        />
        <div className="auto-update-content">
          Update Rabby Wallet Desktop. The new version {releaseCheckInfo.releaseVersion} is available.{' '}
        </div>
        <div className="auto-update-action">
          <Button
            type="text"
            onClick={() => {
              requestDownload()
            }}
          >Download</Button>
        </div>
      </div>
    </div>
  );
};
