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
    stepCheckConnected,
    checkDownloadAvailble,
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
        <div className={styles.btnText}>
          {stepCheckConnected === 'process'
            ? 'Connecting...'
            : 'Downloading...'}
        </div>
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
      onClick={async (evt) => {
        evt.stopPropagation();
        if (stepCheckConnected !== 'finish') {
          const isValid = await checkDownloadAvailble();
          if (isValid) {
            requestDownload();
          }
        }
      }}
    >
      <img
        src="rabby-internal://assets/icons/update/download.svg"
        className={classNames(styles.btnIcon)}
        alt=""
      />
      <div className={styles.btnText}>
        {stepCheckConnected === 'error' || stepDownloadUpdate === 'error'
          ? 'Retry Update'
          : 'Update'}
      </div>
    </div>
  );
}

const PSUDO_CHECK_CONNECT_URL = `https://download.rabby.io/${
  detectClientOS() === 'darwin'
    ? 'rabby-desktop-latest.dmg'
    : 'rabby-desktop-latest.exe'
}`;

export default function UpdateAndVerify({
  className,
}: React.PropsWithChildren<{
  className?: string;
}>) {
  const {
    releaseCheckInfo,
    stepCheckConnected,
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
      {(currentStep > 0 || stepCheckConnected === 'error') && (
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
            status={
              stepCheckConnected === 'error' ? 'error' : stepDownloadUpdate
            }
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
                  {stepDownloadUpdate === 'wait' && 'Download Files'}
                  {stepDownloadUpdate === 'error' && 'Download Files'}
                  {stepDownloadUpdate === 'process' && (
                    <>
                      Download Files
                      {stepCheckConnected === 'finish' &&
                        ` - ${(progress?.percent || 0).toFixed(0)}%`}
                    </>
                  )}
                  {stepDownloadUpdate === 'finish' && 'Download Progress: 100%'}
                </>
              </span>
            }
            description={
              <div className={styles.stepExplaination}>
                {stepDownloadUpdate === 'process' &&
                  stepCheckConnected === 'process' && (
                    <>
                      Connecting to the server, server address:
                      <span className="underline ml-[2px]">
                        {PSUDO_CHECK_CONNECT_URL}
                      </span>
                    </>
                  )}
                {stepDownloadUpdate === 'process' &&
                  stepCheckConnected === 'finish' && (
                    <>
                      Connected to the server, server address:
                      <span className="underline ml-[2px]">
                        {PSUDO_CHECK_CONNECT_URL}
                      </span>
                      <div className="mt-[8px]">Downloading files</div>
                    </>
                  )}
                {stepCheckConnected === 'error' && (
                  <>Fail to connect to the server</>
                )}

                {isDownloaded && !isDownloadedFailed && 'Download complete'}
                {isDownloaded && isDownloadedFailed && 'Fail to download file'}
              </div>
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
              <div className={styles.stepExplaination}>
                {stepVerification === 'process' && 'Verifying...'}
                {stepVerification === 'finish' &&
                  'The digital signature of the downloaded file is verified by Rabby Official. Please install and re-launch the app.'}
                {stepVerification === 'error' &&
                  'Fail to verify file digital signature'}
              </div>
            }
          />
        </Steps>
      )}
    </div>
  );
}
