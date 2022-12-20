import { useAppUpdator } from '../../../../hooks/useAppUpdator';
import style from './index.module.less';

export const AutoUpdate = () => {
  const {
    releaseCheckInfo,
    isDownloading,
    isDownloaded,
    requestDownload,
    progress,
    quitAndUpgrade,
  } = useAppUpdator();

  if (!releaseCheckInfo.hasNewRelease) {
    return null;
  }

  if (isDownloading) {
    return (
      <div className={style.autoUpdate}>
        <div className="auto-update is-downloading">
          <img
            src="rabby-internal://assets/icons/update/downloading.svg"
            className="auto-update-icon animate"
            alt=""
          />
          <div className="auto-update-content">
            {(progress?.percent || 0).toFixed(0)}% completed
          </div>
        </div>
      </div>
    );
  }
  if (isDownloaded) {
    return (
      <div className={style.autoUpdate}>
        <div
          className="auto-update is-downloaded"
          onClick={() => {
            quitAndUpgrade();
          }}
        >
          <img
            src="rabby-internal://assets/icons/update/install.svg"
            className="auto-update-icon"
            alt=""
          />
          <div className="auto-update-content">Install Now</div>
        </div>
      </div>
    );
  }
  return (
    <div className={style.autoUpdate}>
      <div
        className="auto-update"
        onClick={() => {
          requestDownload();
        }}
      >
        <img
          src="rabby-internal://assets/icons/update/download.svg"
          className="auto-update-icon"
          alt=""
        />
        <div className="auto-update-content">Update Rabby</div>
      </div>
    </div>
  );
};
