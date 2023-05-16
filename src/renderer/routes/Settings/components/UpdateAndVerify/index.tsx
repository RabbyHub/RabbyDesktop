import classNames from 'classnames';
import { Steps } from 'antd';

import { useEffect, useMemo } from 'react';
import { detectClientOS } from '@/isomorphic/os';
import LoadingDots from '@/renderer/components/LoadingDots';
import { openExternalUrl } from '@/renderer/ipcRequest/app';
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

  useEffect(() => {
    if (stepDownloadUpdate === 'finish') {
      verifyDownloadedPackage();
    }
  }, [stepDownloadUpdate, verifyDownloadedPackage]);

  if (!releaseCheckInfo.hasNewRelease) {
    return null;
  }

  if (stepDownloadUpdate === 'process') {
    return (
      <div
        className={classNames(
          styles.updateAndVerifyBtn,
          className,
          styles['is-downloading'],
          stepCheckConnected === 'process' && styles.disabledDueToLoading
        )}
      >
        {/* <img
          src="rabby-internal://assets/icons/update/downloading.svg"
          className={classNames(styles.btnIcon, styles['is-animate'])}
          alt=""
        /> */}
        <div className={classNames(styles.btnText)}>
          {stepCheckConnected === 'process' ? (
            <>
              Connecting
              <LoadingDots className="inline-block w-[14px]" />
            </>
          ) : (
            <>
              Downloading
              <LoadingDots className="inline-block w-[14px]" />
            </>
          )}
        </div>
      </div>
    );
  }

  if (isDownloaded && !isDownloadedFailed) {
    if (stepVerification !== 'finish') {
      return (
        <div
          className={classNames(
            styles.updateAndVerifyBtn,
            className,
            stepVerification === 'process' && styles.disabledDueToLoading
          )}
          onClick={(evt) => {
            if (stepVerification === 'wait') {
              verifyDownloadedPackage();
            }
          }}
        >
          {/* <img
            src="rabby-internal://assets/icons/update/processing.svg"
            className={classNames(
              styles.btnIcon,
              stepVerification === 'process' && styles['is-animate']
            )}
          /> */}
          <div className={classNames(styles.btnText)}>
            Verify Update
            {stepVerification === 'process' && (
              <LoadingDots className="inline-block w-[14px]" />
            )}
          </div>
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
        {/* <img
          src="rabby-internal://assets/icons/update/install.svg"
          className={classNames(styles.btnIcon)}
          alt=""
        /> */}
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
            await requestDownload();
          }
        }
      }}
    >
      {/* <img
        src="rabby-internal://assets/icons/update/download.svg"
        className={classNames(styles.btnIcon)}
        alt=""
      /> */}
      <div className={styles.btnText}>
        {stepCheckConnected === 'error' || stepDownloadUpdate === 'error'
          ? 'Retry Update'
          : 'Update'}
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
    appUpdateURL,
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
                  {['wait', 'error'].includes(stepDownloadUpdate) &&
                    'Download Files'}
                  {stepDownloadUpdate === 'process' && (
                    <span>
                      Download Files
                      {stepCheckConnected === 'finish' &&
                        ` - ${(progress?.percent || 0).toFixed(0)}%`}
                    </span>
                  )}
                  {stepDownloadUpdate === 'finish' && 'Download files: 100%'}
                </>
              </span>
            }
            description={
              <div className={styles.stepExplaination}>
                {stepDownloadUpdate === 'process' &&
                  stepCheckConnected === 'process' && (
                    <div
                      className={classNames(
                        styles.stepSubStep,
                        styles.activeSubStep
                      )}
                    >
                      Connecting to the server, server address:
                      <span
                        className={classNames(
                          'ml-[2px]',
                          appUpdateURL && 'underline cursor-pointer'
                        )}
                        onClick={() => {
                          if (!appUpdateURL) return;
                          openExternalUrl(appUpdateURL);
                        }}
                      >
                        {appUpdateURL || '-'}
                      </span>
                    </div>
                  )}
                {stepCheckConnected === 'finish' && (
                  <div
                    className={classNames(styles.stepSubStep, styles.confirmed)}
                  >
                    Connected to the server, server address:
                    <span
                      className={classNames(
                        'ml-[2px]',
                        appUpdateURL && 'underline cursor-pointer'
                      )}
                      onClick={() => {
                        if (!appUpdateURL) return;
                        openExternalUrl(appUpdateURL);
                      }}
                    >
                      {appUpdateURL || '-'}
                    </span>
                  </div>
                )}
                {stepDownloadUpdate === 'process' &&
                  stepCheckConnected === 'finish' && (
                    <div
                      className={classNames(
                        styles.stepSubStep,
                        styles.activeSubStep
                      )}
                    >
                      Downloading files
                    </div>
                  )}
                {stepCheckConnected === 'error' && (
                  <div className={classNames(styles.stepSubStep)}>
                    Fail to connect to the server
                  </div>
                )}

                {isDownloaded && !isDownloadedFailed && (
                  <div className={styles.stepSubStep}>Download complete</div>
                )}
                {isDownloaded && isDownloadedFailed && (
                  <div className={styles.stepSubStep}>
                    Fail to download file
                  </div>
                )}
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
                {stepVerification === 'process' && (
                  <span
                    className={classNames(
                      styles.stepSubStep,
                      styles.activeSubStep
                    )}
                  >
                    Verifying file digital signature...
                  </span>
                )}
                {stepVerification === 'finish' && (
                  <span className={classNames(styles.stepSubStep)}>
                    The digital signature of the downloaded file is verified by
                    Rabby Official. Please install and re-launch the app.
                  </span>
                )}
                {stepVerification === 'error' && (
                  <span className={classNames(styles.stepSubStep)}>
                    Fail to verify file digital signature
                  </span>
                )}
              </div>
            }
          />
        </Steps>
      )}
    </div>
  );
}
