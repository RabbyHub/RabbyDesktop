import { useAppUpdator } from '../../../../hooks/useAppUpdator';
import style from './index.module.less';

export const AutoUpdate = () => {
  const {
    releaseCheckInfo,
    isDownloading,
    isDownloaded,
    requestDownload,
    progress,
  } = useAppUpdator();

  if (!releaseCheckInfo.hasNewRelease) {
    return null;
  }

  if (isDownloading) {
    return (
      <div className={style.autoUpdate}>
        <div className="auto-update is-downloading">
          <img
            src="rabby-internal://assets/icons/internal-homepage/icon-update-loading.svg"
            className="auto-update-icon animate"
            alt=""
          />
          <div className="auto-update-content">Downloading</div>
          <div className="auto-update-action">
            {(progress?.percent || 0).toFixed(0)}% completed
          </div>
        </div>
      </div>
    );
  }
  if (isDownloaded) {
    return (
      <div className={style.autoUpdate}>
        <div className="auto-update is-downloaded">
          <img
            src="rabby-internal://assets/icons/internal-homepage/icon-update-success.svg"
            className="auto-update-icon"
            alt=""
          />
          <div className="auto-update-content">
            Update installation is ready
          </div>
          <div className="auto-update-action">
            <a
              href="#/"
              onClick={(e) => {
                e.preventDefault();
                // todo restart dapp
              }}
            >
              Inastall Now
            </a>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={style.autoUpdate}>
      <div className="auto-update">
        <img
          src="rabby-internal://assets/icons/internal-homepage/icon-update-loading.svg"
          className="auto-update-icon"
          alt=""
        />
        <div className="auto-update-content">
          Update Rabby Wallet Desktop. The new version{' '}
          {releaseCheckInfo.releaseVersion} is available.{' '}
        </div>
        <div className="auto-update-action">
          <a
            href="#/"
            onClick={(e) => {
              e.preventDefault();
              requestDownload();
            }}
          >
            Download
          </a>
        </div>
      </div>
    </div>
  );
};
