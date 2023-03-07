import classNames from 'classnames';
import { useAppUpdator } from '../../../../hooks/useAppUpdator';
import style from './index.module.less';

interface AutoUpdateProps {
  isFold?: boolean;
}
export const AutoUpdate = ({ isFold }: AutoUpdateProps) => {
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
      <div className={classNames(style.autoUpdate, isFold && style.isFold)}>
        <div className="auto-update is-downloading">
          <img
            src="rabby-internal://assets/icons/update/downloading.svg"
            className="auto-update-icon is-animate"
            alt=""
          />
          <div className="auto-update-content">downloading</div>
          {/* <div className="auto-update-content">
            {(progress?.percent || 0).toFixed(0)}% {isFold ? '' : 'completed'}
          </div> */}
        </div>
      </div>
    );
  }
  if (isDownloaded) {
    return (
      <div className={classNames(style.autoUpdate, isFold && style.isFold)}>
        <div
          className="auto-update is-downloaded"
          onClick={(evt) => {
            evt.stopPropagation();
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
    <div className={classNames(style.autoUpdate, isFold && style.isFold)}>
      <div
        className="auto-update"
        onClick={(evt) => {
          evt.stopPropagation();
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
