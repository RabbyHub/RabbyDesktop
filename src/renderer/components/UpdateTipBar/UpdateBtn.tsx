import styled from 'styled-components';
import { useAppUpdator } from '@/renderer/hooks/useAppUpdator';

import clsx from 'clsx';
import IconDownloading from './icons/downloading.svg';
import IconTipError from './icons/tip-error.svg';
import LoadingDots from '../LoadingDots';

const UpdateArea = styled.div`
  padding-bottom: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;

  .common-px {
    padding-left: 32px;
    padding-right: 32px;
  }
`;

const UpdateBtn = styled.div`
  margin: 0 auto;
  text-align: center;

  .auto-update {
    width: 220px;
    height: 48px;
    background: var(--r-blue-default, #7084ff);
    border-radius: 4px;
    padding: 10px 0;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 48px;
    gap: 6px;
    cursor: pointer;

    color: var(--r-neutral-title-2, #fff);
    text-align: center;
    font-size: 15px;
    font-weight: 510;
    font-weight: 500;
    min-width: 148px;

    transition: width var(--mainwin-sidebar-animation-second);

    &:hover {
      opacity: 0.9;
    }

    a {
      color: var(--color-purewhite);
      text-decoration: underline;
      font-weight: 700;
      font-size: 16px;
      line-height: 19px;
    }

    &.is-downloading,
    &.is-downloaded {
      a {
        color: var(--color-purewhite);
        text-decoration: underline;
        font-weight: 500;
        font-size: 16px;
        line-height: 19px;
      }
    }
    &.is-downloading {
      background: var(--r-blue-disable, rgba(112, 132, 255, 0.3));
    }
    &.is-downloaded {
      background: var(--r-green-default, #2abb7f);
    }
  }
  .auto-update-icon {
    width: 20px;
    height: 20px;

    &.is-animate {
      animation: rotate 1.5s linear infinite;
    }
  }
  .auto-update-content {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .auto-update-action {
    margin-left: auto;
  }
`;

function ErrorTipBlock({
  children,
  className,
  innerClassName,
  iconClassName,
  textClassName,
}: React.PropsWithChildren<{
  className?: string;
  innerClassName?: string;
  iconClassName?: string;
  textClassName?: string;
}>) {
  return (
    <div className={clsx('h-[100%] w-[100%] pb-[16px]', className)}>
      <div
        className={clsx(
          'flex items-start justify-start w-[100%]',
          innerClassName
        )}
      >
        <img
          src={IconTipError}
          className={clsx('w-[14px] h-[14px] relative', iconClassName)}
        />
        <p
          className={clsx(
            'text-r-red-default ml-[4px] text-13 font-normal mb-0',
            textClassName
          )}
        >
          {children}
        </p>
      </div>
    </div>
  );
}

export const BottomUpdateButtonArea = ({
  className,
  onCancel,
}: {
  className?: string;
  onCancel?: () => void;
}) => {
  const {
    releaseCheckInfo,
    stepCheckConnected,
    checkDownloadAvailble,
    stepDownloadUpdate,
    isDownloaded,
    isDownloadedFailed,
    requestDownload,
    progress,
    quitAndUpgrade,
    stepVerification,
    verifyDownloadedPackage,
  } = useAppUpdator();

  if (!releaseCheckInfo.hasNewRelease) {
    return null;
  }

  if (stepDownloadUpdate === 'process') {
    return (
      <UpdateArea className={className}>
        <UpdateBtn>
          <div className="auto-update is-downloading">
            <img
              src={IconDownloading}
              className="auto-update-icon is-animate"
              alt=""
            />
            <div className="auto-update-content">
              <span>Downloading</span>
              {!!progress?.percent && (
                <span className="ml-[4px]">
                  {(progress?.percent || 0).toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        </UpdateBtn>
      </UpdateArea>
    );
  }

  if (isDownloaded) {
    if (isDownloadedFailed) {
      return (
        <UpdateArea className={className}>
          <ErrorTipBlock
            className="common-px w-[100%] flex"
            iconClassName="relative top-[2px]"
            innerClassName="self-end justify-center"
          >
            Download Failed
          </ErrorTipBlock>
          <UpdateBtn>
            <div
              className="auto-update is-error"
              onClick={async (evt) => {
                evt.stopPropagation();
                console.log('[feat] stepCheckConnected', stepCheckConnected);
                const isValid = await checkDownloadAvailble();
                if (isValid) {
                  await requestDownload();
                }
              }}
            >
              <div className="auto-update-content">Retry Update</div>
            </div>
          </UpdateBtn>
        </UpdateArea>
      );
    }

    if (stepVerification !== 'finish') {
      return (
        <UpdateArea className={className}>
          {stepVerification === 'error' && (
            <ErrorTipBlock
              className="common-px w-[100%] flex"
              iconClassName="relative top-[2px]"
              innerClassName="self-end justify-center"
            >
              <div className="text-bold">Update Verification Failed</div>
              We couldn't verify the authenticity of this update. Please do not
              install it and contact support
            </ErrorTipBlock>
          )}
          <UpdateBtn>
            <div
              className="auto-update is-verifying"
              onClick={() => {
                switch (stepVerification) {
                  case 'wait': {
                    verifyDownloadedPackage();
                    break;
                  }
                  case 'error': {
                    onCancel?.();
                    break;
                  }
                  default:
                    break;
                }
              }}
            >
              {stepVerification !== 'error' ? (
                <div className="auto-update-content">
                  Verify
                  {stepVerification === 'process' && (
                    <LoadingDots className="ml-[2px] text-left inline-block w-[14px]" />
                  )}
                </div>
              ) : (
                <div className="auto-update-content">OK</div>
              )}
            </div>
          </UpdateBtn>
        </UpdateArea>
      );
    }

    return (
      <UpdateArea className={className}>
        <UpdateBtn>
          <div
            className="auto-update is-downloaded"
            onClick={(evt) => {
              evt.stopPropagation();
              quitAndUpgrade();
            }}
          >
            {stepVerification === 'finish' && (
              <div className="auto-update-content">Install and re-launch</div>
            )}
          </div>
        </UpdateBtn>
      </UpdateArea>
    );
  }

  return (
    <UpdateArea className={className}>
      <UpdateBtn>
        <div
          className="auto-update"
          onClick={(evt) => {
            evt.stopPropagation();
            requestDownload();
          }}
        >
          <div className="auto-update-content">Update</div>
        </div>
      </UpdateBtn>
    </UpdateArea>
  );
};
