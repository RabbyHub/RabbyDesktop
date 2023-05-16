import classNames from 'classnames';
import { Steps } from 'antd';

import { useMemo } from 'react';
import { detectClientOS } from '@/isomorphic/os';
import { useAppUpdator } from '../../../../hooks/useAppUpdator';
import styles from './index.module.less';

import RcIconStepFinish from './icon-step-finish.svg?rc';
import RcIconStepError from './icon-step-error.svg?rc';

function UpdateAndVerifyButton({
  className,
}: React.PropsWithChildren<{
  className?: string;
}>) {
  const {
    releaseCheckInfo,
    stepDownloadUpdate,
    stepVerification,
    verifyDownloadedPackage,
    isDownloaded,
    isDownloadedFailed,
    requestDownload,
    quitAndUpgrade,
  } = useAppUpdator();

  if (!releaseCheckInfo.hasNewRelease) {
    return null;
  }

  if (stepDownloadUpdate === 'process') {
    return (
      <div
        className={classNames(
          styles.updateAndVerifyBtn,
          className,
          styles['is-downloading']
        )}
      >
        <img
          src="rabby-internal://assets/icons/update/downloading.svg"
          className={classNames(styles.btnIcon, styles['is-animate'])}
          alt=""
        />
        <div className={styles.btnText}>Downloading...</div>
      </div>
    );
  }

  if (isDownloaded && !isDownloadedFailed) {
    if (stepVerification !== 'finish') {
      return (
        <div
          className={classNames(styles.updateAndVerifyBtn, className)}
          onClick={(evt) => {
            if (stepVerification === 'wait') {
              verifyDownloadedPackage();
            }
          }}
        >
          <img
            src="rabby-internal://assets/icons/update/processing.svg"
            className={classNames(
              styles.btnIcon,
              stepVerification === 'process' && styles['is-animate']
            )}
            alt=""
          />
          <div className={styles.btnText}>Verify Update</div>
        </div>
      );
    }

    return (
      <div
        className={classNames(
          styles.updateAndVerifyBtn,
          className,
          styles['is-downloaded']
        )}
        onClick={(evt) => {
          evt.stopPropagation();
          quitAndUpgrade();
        }}
      >
        <img
          src="rabby-internal://assets/icons/update/install.svg"
          className={classNames(styles.btnIcon)}
          alt=""
        />
        <div className={styles.btnText}>Install and Re-launch</div>
      </div>
    );
  }

  return (
    <div
      className={classNames(styles.updateAndVerifyBtn, className)}
      onClick={(evt) => {
        evt.stopPropagation();
        requestDownload();
      }}
    >
      <img
        src="rabby-internal://assets/icons/update/download.svg"
        className={classNames(styles.btnIcon)}
        alt=""
      />
      <div className={styles.btnText}>
        {stepDownloadUpdate === 'error' ? 'Retry Update' : 'Update'}
      </div>
    </div>
  );
}

export default function UpdateAndVerify({
  className,
}: React.PropsWithChildren<{
  className?: string;
}>) {
  const {
    releaseCheckInfo,
    stepVerification,
    stepDownloadUpdate,
    isDownloaded,
    isDownloadedFailed,
    progress,
  } = useAppUpdator();

  const currentStep = useMemo(() => {
    if (stepDownloadUpdate === 'wait') return 0;
    if (stepVerification === 'wait') return 1;

    return 2;
  }, [stepVerification, stepDownloadUpdate]);

  if (!releaseCheckInfo.hasNewRelease) {
    return null;
  }

  return (
    <div className={classNames(styles.updateAndVerify, className)}>
      <UpdateAndVerifyButton />
      {currentStep > 0 && (
        <Steps
          direction="vertical"
          size="small"
          current={currentStep}
          // percent={isDownloading ? (progress?.percent || 0) : 0}
          className="mt-[18px]"
        >
          <Steps.Step
            className={styles.stepItem}
            stepIndex={1}
            status={stepDownloadUpdate}
            icons={{
              finish: <RcIconStepFinish className={styles.stepIconSvg} />,
              error: <RcIconStepError className={styles.stepIconSvg} />,
            }}
            title={
              <span
                className={classNames(
                  styles.stepTitle,
                  isDownloaded && styles.J_finished
                )}
              >
                <>
                  {stepDownloadUpdate === 'wait' && 'Download Update'}
                  {stepDownloadUpdate === 'process' && (
                    <>
                      Download Files -{' '}
                      {`${(progress?.percent || 0).toFixed(0)}%`}
                    </>
                  )}
                  {stepDownloadUpdate === 'finish' && 'Download Progress: 100%'}
                  {stepDownloadUpdate === 'error' && 'Download Update'}
                </>
              </span>
            }
            description={
              <p className={styles.stepExplaination}>
                {stepDownloadUpdate === 'process' && (
                  <>
                    Connected to the server, server address:
                    <span className="underline ml-[2px]">
                      https://download.rabby.io/
                      {detectClientOS() === 'darwin'
                        ? 'rabby-desktop-latest.dmg'
                        : 'rabby-desktop-latest.exe'}
                    </span>
                    <p className="mt-[8px]">Downloading files</p>
                  </>
                )}
                {isDownloaded && !isDownloadedFailed && 'Download complete'}
                {isDownloaded && isDownloadedFailed && 'Fail to download file'}
              </p>
            }
          />
          <Steps.Step
            className={styles.stepItem}
            stepIndex={2}
            status={stepVerification}
            icons={{
              finish: <RcIconStepFinish className={styles.stepIconSvg} />,
              error: <RcIconStepError className={styles.stepIconSvg} />,
            }}
            title={
              <span
                className={classNames(
                  styles.stepTitle,
                  stepVerification === 'finish' && styles.J_finished
                )}
              >
                Verify file digital signature
              </span>
            }
            description={
              <p className={styles.stepExplaination}>
                {stepVerification === 'process' && 'Verifying...'}
                {stepVerification === 'finish' &&
                  'The digital signature of the downloaded file is verified by Rabby Official. Please install and re-launch the app.'}
                {stepVerification === 'error' &&
                  'Fail to verify file digital signature'}
              </p>
            }
          />
        </Steps>
      )}
    </div>
  );
}
